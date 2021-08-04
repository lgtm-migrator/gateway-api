import { SearchPreferencesModel } from './searchpreferences.model';

const addUserSearchPreference = async req => {
	return new Promise(async (resolve, reject) => {
		let searchPreferences = new SearchPreferencesModel();
		const { name, filterCriteria } = req.body;
		const { id } = req.user;

		searchPreferences.name = name;
		searchPreferences.filterCriteria = filterCriteria;
		searchPreferences.userId = id;

		let newSearchPreferencesObj = await searchPreferences.save();
		if (!newSearchPreferencesObj) reject(new Error(`Can't persist data object to DB.`));

		resolve(newSearchPreferencesObj);
	});
};

const getAllSavedSearchPreferences = async req => {
	return new Promise(async resolve => {
		const userId = req.user.id;
		const userSearchPreferences = await SearchPreferencesModel.find({ userId }).lean();
		resolve(userSearchPreferences);
	});
};

const getSavedSearchPreference = async req => {
	return new Promise(async resolve => {
		const { id } = req.params;
		const userId = req.user.id;

		const userSearchPreferences = await SearchPreferencesModel.findOne({ _id: id, userId }).lean();
		resolve(userSearchPreferences);
	});
};

const deleteUserSearchPreference = async req => {
	return new Promise(async (resolve, reject) => {
		const { id } = req.params;
		const userId = req.user.id;

		const deletedUserSearchPreferences = await SearchPreferencesModel.findOneAndDelete({ _id: id, userId });
		if (!deletedUserSearchPreferences) reject('Delete operation failed');
		resolve(id);
	});
};

export { addUserSearchPreference, deleteUserSearchPreference, getAllSavedSearchPreferences, getSavedSearchPreference };
