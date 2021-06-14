export const datasets_commercial = [
	{
		id: 1,
		datautility: {
			allowable_uses: '',
		},
		datasetv2: {
			accessibility: {
				usage: {
					dataUseLimitation: 'GENERAL RESEARCH USE',
				},
			},
		},
	},
	{
		id: 2,
		datautility: {
			allowable_uses: '',
		},
		datasetv2: {
			accessibility: {
				usage: {
					dataUseLimitation: 'COMMERCIAL RESEARCH USE',
				},
			},
		},
	},
	{
		id: 3,
		datautility: {
			allowable_uses: '',
		},
		datasetv2: {
			accessibility: {
				usage: {
					dataUseLimitation: ['COMMERCIAL RESEARCH USE', 'NO RESTRICTION'],
				},
			},
		},
	},
	{
		id: 4,
		datautility: {
			allowable_uses: 'Gold',
		},
		datasetv2: {
			accessibility: {
				usage: {
					dataUseLimitation: ['RESEARCH USE ONLY'],
				},
			},
		},
	},
	{
		id: 5,
		datautility: {
			allowable_uses: 'Bronze',
		},
		datasetv2: {
			accessibility: {
				usage: {
					dataUseLimitation: '',
				},
			},
		},
	},
	{
		id: 6,
		datasetv2: {
			accessibility: {
				usage: {
					dataUseLimitation: 'USER SPECIFIC RESTRICTION',
				},
			},
		},
	},
	{
		id: 7,
		datasetv2: {
			accessibility: {
				usage: {
					dataUseLimitation: 'USER SPECIFIC RESTRICTION',
				},
			},
		},
	},
	{
		id: 8,
		datautility: {
			allowable_uses: 'Gold',
		},
		datasetv2: {
			accessibility: {
				usage: {
					dataUseLimitation: 'NOT FOR PROFIT USE',
				},
			},
		},
	},
	{
		id: 9,
		datautility: {
			allowable_uses: 'Bronze',
		},
		datasetv2: {
			accessibility: {
				usage: {
					dataUseLimitation: ['NOT FOR PROFIT USE', 'COMMERCIAL RESEARCH USE'],
				},
			},
		},
	},
];

export const datasets_commercial_expected = [
	{
		id: 1,
		datautility: {
			allowable_uses: '',
		},
		datasetv2: {
			accessibility: {
				usage: {
					dataUseLimitation: 'GENERAL RESEARCH USE',
				},
			},
		},
		commercialUse: false,
	},
	{
		id: 2,
		datautility: {
			allowable_uses: '',
		},
		datasetv2: {
			accessibility: {
				usage: {
					dataUseLimitation: 'COMMERCIAL RESEARCH USE',
				},
			},
		},
		commercialUse: true,
	},
	{
		id: 3,
		datautility: {
			allowable_uses: '',
		},
		datasetv2: {
			accessibility: {
				usage: {
					dataUseLimitation: ['COMMERCIAL RESEARCH USE', 'NO RESTRICTION'],
				},
			},
		},
		commercialUse: true,
	},
	{
		id: 4,
		datautility: {
			allowable_uses: 'Gold',
		},
		datasetv2: {
			accessibility: {
				usage: {
					dataUseLimitation: ['RESEARCH USE ONLY'],
				},
			},
		},
		commercialUse: true,
	},
	{
		id: 5,
		datautility: {
			allowable_uses: 'Bronze',
		},
		datasetv2: {
			accessibility: {
				usage: {
					dataUseLimitation: '',
				},
			},
		},
		commercialUse: false,
	},
	{
		id: 6,
		datasetv2: {
			accessibility: {
				usage: {
					dataUseLimitation: 'USER SPECIFIC RESTRICTION',
				},
			},
		},
		commercialUse: false,
	},
	{
		id: 7,
		datasetv2: {
			accessibility: {
				usage: {
					dataUseLimitation: 'USER SPECIFIC RESTRICTION',
				},
			},
		},
		commercialUse: false,
	},
	{
		id: 8,
		datautility: {
			allowable_uses: 'Gold',
		},
		datasetv2: {
			accessibility: {
				usage: {
					dataUseLimitation: 'NOT FOR PROFIT USE',
				},
			},
		},
		commercialUse: true,
	},
	{
		id: 9,
		datautility: {
			allowable_uses: 'Bronze',
		},
		datasetv2: {
			accessibility: {
				usage: {
					dataUseLimitation: ['NOT FOR PROFIT USE', 'COMMERCIAL RESEARCH USE'],
				},
			},
		},
		commercialUse: false,
	},
];
