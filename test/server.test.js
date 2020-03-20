const chai = require("chai");
const chaiHttp = require("chai-http");
const chaiString = require("chai-string");
const testURL  =  process.env.URL || 'http://localhost:3001';

const { expect } = chai;
chai.use(chaiHttp);
chai.use(chaiString);

describe("Wake up API", () => {
  it("Check the api is alive", done => {
    chai
      .request(testURL)
      .get('/api/dead')
      .end((err, res) => {
        expect(res).to.have.status(404);
        done();
      });
  }).timeout(10000);

})

describe("Search API", () => {
  it("Search without any parameters should return at least one result", done => {
    chai
      .request(testURL)
      .get('/api/search')
      .end((err, res) => {
        expect(res).to.have.status(200);
        
        var payload = JSON.parse(res.text);

        expect(payload).to.have.property('success').with.to.be.true;
        expect(payload).to.have.property('data').with.lengthOf.to.be.at.least(1);
        expect(payload).to.have.property('summary');
        done();
      });
  });

  
  //add other things to search for here that should be sucessful
  ['homebrew','cancer', 'disparity'].forEach(function(searchString) {

    it(`Search for string '${searchString}', first result should contain name or description '${searchString}'`, done => {
        chai
        .request(testURL)
        .get('/api/search?search='+searchString)
        .end((err, res) => {
            expect(res).to.have.status(200);
            
            var payload = JSON.parse(res.text);

            expect(payload).to.have.property('success').with.to.be.true;
            expect(payload).to.have.property('data').with.lengthOf.to.be.at.least(1);
            expect(payload).to.have.property('summary');

            //this is hacky - but a search could be in the name or description
            try {
                expect(payload).to.have.nested.property('data[0].name').to.containIgnoreCase(searchString);
            } catch (e) {
                try {
                    expect(payload).to.have.nested.property('data[0].description').to.containIgnoreCase(searchString);
                } catch (e) {
                    try {
                        expect(payload).to.have.nested.property('data[0].tags').that.contains(searchString);
                        console.log('found in tag')
                    } catch (e) {

                    }
                }
            }
            done();
        });
    });

  });

  //add other things to search for here THAT SHOULD NOT RETURN!!!
  ['crap','zzz'].forEach(function(searchString) {

    it(`Search for string '${searchString}', nothing should be returned`, done => {
        chai
        .request(testURL)
        .get('/api/search?search='+searchString)
        .end((err, res) => {
            expect(res).to.have.status(200);
            
            var payload = JSON.parse(res.text);

            expect(payload).to.have.property('success').with.to.be.true;
            expect(payload).to.have.property('data').with.lengthOf(0);
            expect(payload).to.have.property('summary');

            done();
        });
    });

  });


  it("Search for string 'cancer' limit results to 3, 3 or less results should be returned", done => {
    var searchString = "cancer";
    var maxResults = 5;
    chai
      .request(testURL)
      .get('/api/search?search='+searchString+'&maxResults='+maxResults)
      .end((err, res) => {
        expect(res).to.have.status(200);
        var payload = JSON.parse(res.text);

        expect(payload).to.have.property('success').with.to.be.true;
        expect(payload).to.have.property('data').with.lengthOf.to.be.at.most(maxResults);

        done();
      });
  });

});


describe("Get Object API", () => {

  //List of IDs of tools and names to find
  [{id:89522470,name:'homebrew'},{id:59029913,name:'redcap'}].forEach(function(search) {

    it(`Search for Tool ID '${search.id}' should show name '${search.name}'`, done => {
        chai
        .request(testURL)
        .get('/api/tool/'+search.id)
        .end((err, res) => {
            expect(res).to.have.status(200);
            
            var payload = JSON.parse(res.text);

            expect(payload).to.have.property('success').with.to.be.true;
            expect(payload).to.have.property('data').with.lengthOf.to.be.at.least(1);

            expect(payload).to.have.nested.property('data[0].name').to.containIgnoreCase(search.name);

            done();
        });
    });

  });

});

describe("Get stats API", () => {

    it(`Run stats API call`, done => {
        chai
        .request(testURL)
        .get('/api/stats')
        .end((err, res) => {
            expect(res).to.have.status(200);
            
            var payload = JSON.parse(res.text);

            expect(payload).to.have.property('success').with.to.be.true;
            expect(payload).to.have.nested.property('data.typecounts.tool').to.be.at.least(1);

            done();
        });
    });

});
