const fs = require('fs/promises');
const {
  program,
  InvalidArgumentError,
} = require('commander');

const writeFile = (data, filename) => {
  fs.writeFile(filename, data)
    .then(() => console.log(`Created ${filename}`))
    .catch((e) => console.log(`Failed to create ${filename}: ${e.message}`))
};

const makeComponent = (componentName, opt) => {
  console.log(`Creating component: ${componentName}`);

  const {
    story,
    test,
    props = [],
    propTypes,
  } = opt;

  const componentTemplate = `${propTypes ? `import PropTypes from 'prop-types';\n\n` : ``}export const ${componentName} = (${propTypes ? `{` : ``}${props.map(({ name, defaultValue }) => `${name}${defaultValue ? ` = ${defaultValue}`: `` }`).join(', ')}${propTypes ? `}` : ``}) => {
  return (
    <></>
  );
};
${propTypes ?
      `
${componentName}.propTypes = {
${props.map(({ name, required, type }) => {
        const field = [`PropTypes`];
        type ? field.push(type) : field.push('any');
        required && field.push(`isRequired`);

        return (`  ${name}: ${field.join(`.`)}`);
      }).join(`\n\r`)}
};`
      :
      ``
    }
export default ${componentName};`;

  const testTemplate = `import { render, screen } from '@testing-library/react';
import ${componentName} from './${componentName}';

describe('#<${componentName} />', () => {
  it('renders without errors', () => {
    render(<${componentName} />);
  })
});`;

  const storyTemplate = `import <${componentName} /> from './${componentName}';

export default {
  title: 'Components/${componentName}',
  component: ${componentName},
};

const Template = (args) => <${componentName} {...args} />;

export const Primary = Template.bind({});
Primary.args = {
${props.map(({ name }) => (`  //${name}: ,`)).join(`\n`)}
};`

writeFile(componentTemplate, `${componentName}.js`);
if(story) writeFile(storyTemplate, `${componentName}.stories.js`);
if(test) writeFile(testTemplate, `${componentName}.test.js`);


};

const parseProps = (v, p) => {
  try {
    let [name, required = false, type = 'any', defaultValue = null] = v.split(':');

    if(type == "string" && defaultValue) defaultValue = `"${defaultValue}"`

    return (
      p.concat([
        {
          name: name,
          required: required == 'true',
          type: type,
          defaultValue: defaultValue,
        }
      ]));
  } catch (e) {
    throw new InvalidArgumentError(`Invalid prop: ${v}`)
  }
};

program
  .name(`make-component`)
  .description(`Create stub code for new React components in one command. Supports React tests, and Storybook.`)
  .version('1.0.0', '-v')
  .argument(`<string>`, `Name of component to create.`)
  .option(`--no-story`, `Skip generating the default story.`)
  .option(`--no-test`, `Skip generating the default test.`)
  .option(`--no-prop-types`, `Skip generating the PropType portion of the component.`)
  .option(`-p, --props <value>`, `Prop to include as 'name:required:type'. Default required is 'false'. Default type is 'any'.`, parseProps, [])
  .action(makeComponent)

program.parse();