global.DATABASE_URL = 'mongodb://localhost/shopping-list-test';

var chai = require('chai');
var chaiHttp = require('chai-http');

var server = require('../server.js');
var Item = require('../models/item');

var should = chai.should();
var app = server.app;

chai.use(chaiHttp);

describe('Shopping List', function() {
    before(function(done) {
        server.runServer(function() {
            Item.create({name: 'Broad beans', id: 1},
                        {name: 'Tomatoes', id: 2},
                        {name: 'Peppers', id: 3}, function() {
                done();
            });
        });
    });
     it('should list items on GET', function(done) {
        chai.request(app)
            .get('/items')
            .end(function(err, res) {
                should.equal(err, null)
                res.should.have.status(200)
                res.should.be.json
                console.log(res.body)
                res.body.should.be.a('array')
                res.body.should.have.length(3)
                res.body[0].should.be.a('object')
                res.body[0].should.have.property('_id')
                res.body[0].should.have.property('name')
                res.body[0]['_id'].should.be.a('string')
                res.body[0].name.should.be.a('string')
                res.body[0].name.should.equal('Broad beans')
                res.body[1].name.should.equal('Tomatoes')
                res.body[2].name.should.equal('Peppers')
                done()
            })
    })
    it('should add an item on POST', function(done) {
            chai.request('/items')
                .done();    
    })
    it('should add an item on POST', function(done) {
        chai.request(app)
            .post('/items')
            .send({
                'name': 'Kale'
            })
            .end(function(err, res) {
                should.equal(err, null)
                res.should.have.status(201)
                res.should.be.json
                res.body.should.be.a('object')
                res.body.should.have.property('status')
                res.body.status.should.equal("Successfully posted something")
                res.body.should.have.property('item')
                res.body.item.should.have.property('name')
                res.body.item.should.have.property('id')
                res.body.item.name.should.be.a('string')
                res.body.item.id.should.be.a('number')
                res.body.item.id.should.equal(4)
                res.body.item.name.should.equal('Kale')
                done()
            })
    })
    it('should bounce duplicate items on POST', function(done) {
        chai.request(app)
            .post('/items')
            .send({
                'name': 'Kale'
            })
            .end(function(err, res) {
                //should.not.equal(err, null)
                res.should.have.status(400)
                res.should.be.json
                res.body.should.be.a('object')
                res.body.should.have.property('status')
                res.body.status.should.equal("Successfully posted something")
                res.body.should.have.property('item')
                res.body.item.should.have.property('name')
                res.body.item.should.have.property('id')
                res.body.item.name.should.be.a('string')
                res.body.item.id.should.be.a('number')
                res.body.item.id.should.equal(4)
                res.body.item.name.should.equal('Kale')
                done()
            })
    })
    it('should edit an item on put', function(done) {
        chai.request(app)
            .put('/items/3')
            .send({
                'replace': "Tomatoes",
                'name': 'New 3 Kale'
            })
            .end(function(err, res) {
                should.equal(err, null)
                res.should.be.json
                res.should.have.status(200)
                res.body.should.have.property('ok')
                res.body.ok.should.be.a('number')
                res.body.ok.should.equal(1)
                done()
            })
    })
    it('should THEN reflect the newly-altered item', function(done) {
        chai.request(app)
            .get('/items')
            .end(function(err, res) {
                should.equal(err, null)
                res.should.have.status(200)
                res.should.be.json
                res.body.should.be.a('array')
                res.body.should.have.length(4)
                res.body[2].should.be.a('object')
                res.body[2].should.have.property('id')
                res.body[2].id.should.equal(3)
                res.body[2].should.have.property('name')
                res.body[2]['_id'].should.be.a('string')
                res.body[2].name.should.be.a('string')
                res.body[2].name.should.equal('New 3 Kale')
                done()
            })
    })
    it('should delete an item on delete', function(done) {
        chai.request(app)
            .delete('/items/3')
            .send({
                'target_id': 3
            })
            .end(function(err, res) {
                should.equal(err, null)
                res.should.be.json
                res.should.have.status(200)
                res.body.should.be.a('object')
                res.body.should.have.property('status')
                res.body.status.should.equal("Successfully deleted something")
                res.body.item.should.have.property('id')
                res.body.item.id.should.equal(3)
                res.body.item.should.have.property("name")
                res.body.item.name.should.equal("New 3 Kale")
                done()
            })
    })
    it("should throw an error on POST to an ID that exists", function(done) {
        chai.request(app)
            .post('/items')
            .send({
                'name': 'Kale',
                'id': 1
            })
            .end(function(err, res) {
                // should.equal(err, null)
                res.should.have.status(400)
                res.body.should.be.a('object')
                res.should.be.json
                res.body.should.have.property('error')
                res.body.error.should.equal("The ID you've specified already exists. POSTing is intended for new entries, not replacing one. Please try REPLACE instead.")
                done()
            })
    })
    it("should throw an error on a POST without body data", function(done) {
        chai.request(app)
            .post('/items')
            .send({})
            .end(function(err, res) {
                res.should.have.status(400)
                res.body.should.be.a('object')
                res.should.be.json
                res.body.should.have.property('error')
                res.body.error.should.equal("Your request appears invalid. Please pass valid JSON in the form of {name: item}.")
                done()
            })
    })
    it("should throw an error on POST with something other than valid JSON", function(done) {
        chai.request(app)
            .post('/items')
            .send("{bauble;id:5, slam: true}")
            .end(function(err, res) {
                res.should.have.status(400)
                res.body.should.be.a('object')
                res.should.be.json
                res.body.should.have.property('error')
                res.body.error.should.equal("Your request appears invalid. Please pass valid JSON in the form of {name: item}.")
                done()
            })
    })
    it("should automatically handle a PUT without an ID in the endpoint", function(done) {
        chai.request(app)
            .put('/items/')
            .send({
                'name': 'New 3 Cola - No Longer Kale Flavored'
            })
            .end(function(err, res) {
                // shouldn't trigger an error provided the other information
                // is in good order ...
                should.equal(err, null)
                res.should.be.json
                res.should.have.status(201)
                res.body.should.have.property('status')
                res.body.status.should.be.a('string')
                res.body.status.should.contain('Cheers! Your new entry is at location')
                res.body.should.have.property('item')
                res.body.item.should.have.property('id')
                res.body.item.id.should.equal(5)
                res.body.item.name.should.equal("New 3 Cola - No Longer Kale Flavored")
                done()
            })
    })
    it('should THEN reflect the newly-added/"replaced" item', function(done) {
        chai.request(app)
            .get('/items')
            .end(function(err, res) {
                should.equal(err, null)
                res.should.have.status(200)
                res.should.be.json
                res.body.should.be.a('array')
                // Because we just DELETED an object, well, we still have 4 ...
                res.body.should.have.length(4)
                res.body[3].should.be.a('object')
                res.body[3].should.have.property('id')
                res.body[3].should.have.property('name')
                res.body[3].id.should.be.a('number')
                res.body[3].name.should.be.a('string')
                res.body[3].name.should.equal('New 3 Cola - No Longer Kale Flavored')
                done()
            })
    })
    // // Respectfully, it should handle this put by throwing an error. If they're
    // // using PUT, they intend to replace a very specific item - "handling" the error may lead
    // // to duplicate ID's in the list at the least. i.e. we 'handle' this by ignoring the endpoint
    // // parameter 'n' and tacking it to the end of the list, but retaining the ID - or just ignoring
    // // the object's ID? At that point why aren't we sheparding developers/users to just using POST to ADD?
    it("should handle a PUT with different ID in the endpoint than the body", function(done) {
        chai.request(app)
            .put('/items/1')
            .send({
                'name': 'Nuka Cola Quantum 5 - The Freshmaker!',
                'id': 5
            })
            .end(function(err, res) {
                should.not.equal(err, null)
                res.should.be.json
                res.should.have.status(400)
                res.body.should.have.property('error')
                res.body.error.should.be.a('string')
                res.body.error.should.contain("does not match the ID defined in the object")
                done()
            })
    })
    // This was a really dumb edge case. This would really complicate storage.id counting for no good reason.
    // If anything it should throw an error for such an ID.
    // it("should automatically PUT to an ID that doesn't exist")
    it("should bounce, and throw an error for, a PUT without body data", function(done) {
        chai.request(app)
            .put('/items/4')
            .send(null)
            .end(function(err, res) {
                should.not.equal(err, null)
                res.should.be.json
                res.should.have.status(400)
                res.body.should.have.property('error')
                res.body.error.should.be.a('string')
                res.body.error.should.contain("Request refused. To replace a valid item, we need body data.")
                done()
            })
    })
    it("throw an error for a PUT with something other than valid JSON", function(done){
        chai.request(app)
            .put('/items/4')
            .send("{bauble;id:5, slam: true}")
            .end(function(err, res){
                should.not.equal(err, null)
                res.should.be.json
                res.should.have.status(400)
                res.body.should.have.property('error')
                res.body.error.should.be.a('string')
                res.body.error.should.contain("Request refused. To replace a valid item, we need body data.")
                done()
            })
    })
    it("throw an error for a DELETE an ID that doesn't exist", function(done){
        chai.request(app)
            .delete('/items/10')
            .end(function(err, res){
                should.not.equal(err, null)
                res.should.be.json
                res.should.have.status(400)
                res.body.should.have.property('error')
                res.body.error.should.be.a('string')
                res.body.error.should.equal("The ID you requested to delete (10) did not exist in the list.")
                done()
            })
    })
    // // Curiously enough, no amount of parameter-handling in Express routes seems to
    // // avoid this error. How can this be addressed? In any case, an error IS thrown ...
    it("throw an error for a DELETE without an ID in the endpoint", function(done){
        chai.request(app)
            .delete("/items/")
            .end(function(err, res){
                should.not.equal(err, null)
                res.should.be.json
                res.should.have.status(400)
                res.should.have.property('error')
                should.equal(typeof res.error, 'object')
                should.equal(res.error.toString(), "Error: cannot DELETE /items/ (400)")
                done()
            })
    })

    after(function(done) {
        Item.remove(function() {
            done();
        });
    });
});
