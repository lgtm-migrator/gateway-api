// import constants from '../resources/utilities/constants.util';

// const authoriseUserForPublisher = async (req, res, next) => {
// 	const requestingUser = req.user;
// 	const publisherID = req.params.publisherID;

// 	const isCustodianUser = requestingUser.teams.map(team => team.publisher._id.toString()).includes(publisherID.toString());
// 	const isCustodianUser = requestingUser.teams.map(team => team.type).includes(constants.userTypes.ADMIN);

// 	console.log(test);
// 	console.log(publisherID.toString());

// 	console.log(test.includes(publisherID));

// 	// if (requestingUser.teams.map(team => team.publisher._id).includes(ObjectID(publisherID))) {
// 	// 	return res.status(401).json({
// 	// 		success: false,
// 	// 		message: 'You are not authorised to view these datasets',
// 	// 	});
// 	// }
// 	// next();
// };

// export { authoriseUserForPublisher };
