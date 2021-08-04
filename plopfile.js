const _ = require('lodash');

module.exports = function (plop) {
	plop.setHelper('capitalise', txt => _.capitalize(txt));
	// controller generator
	plop.setGenerator('repositoryPattern', {
		description: 'repository pattern files for new entity',
		prompts: [
			{
				type: 'input',
				name: 'entityName',
				message: 'Please enter entity name in camelcase',
			},
		],
		actions: [
			{
				type: 'add',
				path: 'src/resources/{{entityName}}/{{entityName}}.controller.js',
				templateFile: 'plop-templates/repositoryPattern/controller.hbs',
			},
			{
				type: 'add',
				path: 'src/resources/{{entityName}}/dependency.js',
				templateFile: 'plop-templates/repositoryPattern/dependency.hbs',
			},
            {
				type: 'add',
				path: 'src/resources/{{entityName}}/{{entityName}}.repository.js',
				templateFile: 'plop-templates/repositoryPattern/repository.hbs',
			},
            {
				type: 'add',
				path: 'src/resources/{{entityName}}/{{entityName}}.route.js',
				templateFile: 'plop-templates/repositoryPattern/route.hbs',
			},
            {
				type: 'add',
				path: 'src/resources/{{entityName}}/{{entityName}}.service.js',
				templateFile: 'plop-templates/repositoryPattern/service.hbs',
			},
            {
				type: 'add',
				path: 'src/resources/{{entityName}}/{{entityName}}.model.js',
				templateFile: 'plop-templates/repositoryPattern/model.hbs',
			},
            {
				type: 'add',
				path: 'src/resources/{{entityName}}/{{entityName}}.entity.js',
				templateFile: 'plop-templates/repositoryPattern/entity.hbs',
			},
		],
	});
};
