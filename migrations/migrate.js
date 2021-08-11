import cli from 'migrate-mongoose/src/cli'; //lgtm [js/unused-local-variable]
import mongoose from 'mongoose';
mongoose.connect(process.env.MIGRATE_dbConnectionUri, {
	useNewUrlParser: true,
	useFindAndModify: false,
	useUnifiedTopology: true,
	autoIndex: false,
});

