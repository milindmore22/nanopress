const defaultConfig = require('@wordpress/scripts/config/webpack.config');
const path = require('path');

module.exports = {
	...defaultConfig,
	entry: {
		proofreader: path.resolve(process.cwd(), 'src/proofreader', 'index.ts'),
		translation: path.resolve(process.cwd(), 'src/translation', 'index.ts'),
		summarizer: path.resolve(process.cwd(), 'src/summarizer', 'index.ts'),
	},
};
