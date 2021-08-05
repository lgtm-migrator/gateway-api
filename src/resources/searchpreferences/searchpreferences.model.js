import { model, Schema } from 'mongoose';

const SearchPreferencesSchema = new Schema({
	name: String,
	filterCriteria: {},
	userId: Number,
});

export const SearchPreferencesModel = model('search_preferences', SearchPreferencesSchema);
