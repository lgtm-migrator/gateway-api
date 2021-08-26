import aridhiaService from '../aridhia.service.js';
import { datasetsList } from '../aridhiaMocks.js';

// describe('aridhiaService', function () { 
	
	describe('extractCodesFromAridhiaResponse', function() {
		
		test('testExtractCodesFromAridhiaResponse', () => {
			
			// arrange
			const expectedCodes = [ 
				'dp1_inbound_data', 'driver-project-1-data-model-output', 'ipop-data---intermediate', 'globaldothealth',
				'simulated-covid-19-remdesivir-study', 'clinicaltrialsdotgov', 'jhu_csse_time_series_covid19', 'cord_19',
				'certara-codex', 'certara-codex-data', 'icoda-dummy-dataset', 'owid',
				'phsm'
			];

			// act 
			const codes = aridhiaService.extractCodesFromAridhiaResponse(datasetsList);

			// assert, TODO: compare arrs
			expect(codes[0] === expectedCodes[0]);
		});
		
	});
// });