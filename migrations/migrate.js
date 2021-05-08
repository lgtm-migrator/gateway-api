import cli from 'migrate-mongoose/src/cli'; // Required - DO NOT DELETE
import mongoose from 'mongoose';

mongoose.connect(
	'mongodb+srv://' +
		process.env.user +
		':' +
		process.env.password +
		'@' +
		process.env.cluster +
		'/' +
		process.env.database +
		'?ssl=true&retryWrites=true&w=majority',
	{
		useNewUrlParser: true,
		useFindAndModify: false,
		useUnifiedTopology: true,
		autoIndex: false,
	}
);
