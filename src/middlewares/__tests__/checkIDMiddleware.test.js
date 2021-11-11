import { checkIDMiddleware } from '../index';

describe('checkIDMiddleware', () => {

    const nextFunction = jest.fn();
      
    const mockedResponse = () => {
		const res = {};
		res.status = jest.fn().mockReturnValue(res);
		res.json = jest.fn().mockReturnValue(res);
		return res;
	};

    it('should return 400 response code when we dont have id value into list of paramteres', () => {
        const expectedResponse = {
            success: false,
            message: 'You must provide a dataset identifier'
        };

        const mockedRequest = () => {
            const req = {};
            req.params = {};
            return req;
        };
    
        const mockedReq = mockedRequest();
		const mockedRes = mockedResponse();

        checkIDMiddleware(mockedReq, mockedRes, nextFunction);

        expect(mockedRes.status).toHaveBeenCalledWith(400);
		expect(mockedRes.json).toHaveBeenCalledWith(expectedResponse);
    });

    it('should pass the middleware when we have id value into list of paramteres', () => {
        const expectedResponse = {};

        const mockedRequest = () => {
            const req = {};
            req.params = { id: 1 };
            return req;
        };
 
        const mockedReq = mockedRequest();
		const mockedRes = mockedResponse();

        nextFunction.mockReturnValue(expectedResponse);

        checkIDMiddleware(mockedReq, mockedRes, nextFunction);

        expect(mockedRes.status.mock.calls.length).toBe(0);
		expect(mockedRes.json.mock.calls.length).toBe(0);
		expect(nextFunction.mock.calls.length).toBe(1);
    });
    
});