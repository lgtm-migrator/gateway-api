import { model, Schema } from 'mongoose';

const SearchPreferencesSchema = new Schema(
	{
		name: String,
		filterCriteria: {
			searchTerm: String,
			filters: [],
			tab: String,
			sort: String,
		},
		userId: Number,
	},
	{
		timestamps: true,
	}
);

export const SearchPreferencesModel = model('search_preferences', SearchPreferencesSchema);
