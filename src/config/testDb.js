const mongoose = require('mongoose');

// let client;
// mongoose
// 	.connect('mongodb://localhost:27017/hdruk', {
// 		useNewUrlParser: true,
// 		useFindAndModify: false,
// 		useUnifiedTopology: true,
// 		autoIndex: false, // Don't build indexes
// 		poolSize: 10, // Maintain up to 10 socket connections
// 		// If not connected, return errors immediately rather than waiting for reconnect
// 		bufferMaxEntries: 0,
// 		useNewUrlParser: true,
// 	})
// 	.then((c) => {
// 		client = c;
// 	});

const Task = mongoose.model('tasks', {
	name: String,
	started: Date,
	completed: Boolean,
});

module.exports = {
	getTasks: () => Task.find(),
	addTask: (data) => new Task(data).save(),
	deleteTask: (taskId) => Task.findOneAndDelete({ _id: taskId }),
	getClient: () => client,
};
