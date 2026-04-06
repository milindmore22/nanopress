module.exports = {
	root: true,
	extends: [
		'plugin:@wordpress/eslint-plugin/recommended-with-formatting',
		'plugin:import/recommended',
		'plugin:eslint-comments/recommended',
	],
	parserOptions: {
		project: './tsconfig.json',
		sourceType: 'module',
	},
	env: {
		browser: true,
		node: true,
	},
	ignorePatterns: [
		'build/**',
		'node_modules/**',
		'vendor/**',
		'src/**/*.d.ts',
	],
	settings: {
		'import/resolver': {
			typescript: {
				project: './tsconfig.json',
			},
			node: {
				extensions: ['.js', '.ts'],
			},
		},
	},
	rules: {
		'eslint-comments/no-unlimited-disable': 'error',
		'@wordpress/no-unsafe-wp-apis': 'warn',
		'jsdoc/check-indentation': 'error',
		'no-shadow': 'warn',
		camelcase: 'off',
	},
	overrides: [
		{
			files: ['**/*.ts'],
			rules: {
				'no-undef': 'off',
				'@typescript-eslint/no-shadow': 'warn',
				'no-shadow': 'off',
				'jsdoc/require-param': 'off',
				'jsdoc/require-param-type': 'off',
				'jsdoc/require-returns-type': 'off',
			},
		},
	],
};
