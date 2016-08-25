var express = require('express');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');

var config = require('./config');

var app = express();

app.use(bodyParser.json());
app.use(express.static('public'));

// Our tests make three entries, so as a stopgap, this begins there
var id_pointer = 4;

var runServer = function(callback) {
    mongoose.connect(config.DATABASE_URL, function(err) {
        if (err && callback) {
            return callback(err);
        }

        app.listen(config.PORT, function() {
            console.log('Listening on localhost:' + config.PORT);
            if (callback) {
                callback();
            }
        });
    });
};

if (require.main === module) {
    runServer(function(err) {
        if (err) {
            console.error(err);
        }
    });
};

function isEmpty(obj){
    return (Object.getOwnPropertyNames(obj).length === 0);
}

// Straight-up yanked from http://stackoverflow.com/a/20392392
function tryParseJSON(jsonString){
    try {
        var o = JSON.parse(jsonString);
        if (o && typeof o === "object") {
            return true;
        }
    }
    catch (e) { }
    return false;
};

var Item = require('./models/item');

function findExample(name) {
    console.log("Passed name:",name)
    Item.findOne({ 'name': name }, 'Check for name', function (err, item) {
        if (err) {
            console.log("Err: ",err)
            return err
        }
        console.log("Item: ", item)
        return item !== null
    })
}

app.get('/items', function(req, res) {
    Item.find(function(err, items) {
        if (err) {
            return res.status(500).json({
                message: 'Internal Server Error'
            });
        }
        res.json(items);
    });
});

app.post('/items/:id?', function(req, res) {
    var real_id = (req.body.id) ? req.body.id : id_pointer
    if (!req.body || isEmpty(req.body)) {
        console.log("Invalid request")
        res.status(400).json({
            "error": "Your request appears invalid. Please pass valid JSON in the form of {name: item}."
        })
    }
    else {
        if (id_pointer > req.body.id || id_pointer > req.params.id){
            console.log("ID already exists")
            return res.status(400).json({
                "error": "The ID you've specified already exists. POSTing is intended for new entries, not replacing one. Please try REPLACE instead."
            })
        }
        if( findExample(req.body.name) ) {
            console.log("NAME already exists")
            return res.status(400).json({
                "error": "The name specified already exists in the list. Try, try again."
            })
        }
        else
        {
            Item.create({
                name: req.body.name,
                id: real_id
            }, function(err, item) {
                if (err) {
                    return res.status(500).json({
                        message: 'Internal Server Error'
                    });                                                                                                                                                                                                                                                                                                                                                                                                                                                                             
                }
                res.status(201).json({ status: "Successfully posted something", item: item});
            });
            id_pointer = real_id + 1
        }
    }
});

app.put('/items/:id?', function(req, res) {
    var passed_obj = req.body
    var passed_id = req.params.id || 0
    var inner_id = Number(passed_id)
    if (isNaN(inner_id)) {
        return res.status(400).json({
            "error": "Requested ID '" + req.params.id + "' is not a number."
        })
    }
    if(req.params.id && req.body.id && (req.params.id !== req.body.id)) {
        return res.status(400).json({
            "error": "Requested endpoint id "+req.params.id+" does not match the ID defined in the object: "+req.body.id
        })
    }
    if(isEmpty(passed_obj) || tryParseJSON(passed_obj)){
        return res.status(400).json({
            "error": "Request refused. To replace a valid item, we need body data. Please attempt again in the form of {name: STRING, id: NUMBER}"
        })
    }
    if(req.params.id) {
        var g = Item.where({ id: req.params.id });
        g.update({ name: req.body.name }, function(err, items) {
            if (err) {
                return res.status(500).json({
                    message: 'Internal Server Error: ' + err
                });
            }
            res.json(items);
        })
    }
    else {
        Item.create({
            name: passed_obj.name,
            id: id_pointer
        }, function(err, items) {
            if (err) {
                return res.status(500).json({
                    message: 'Internal Server Error'
                });                                                                                                                                                                                                                                                                                                                                                                                                                                                                             
            }
            return res.status(201).json({ status: "No ID parameter was defined, so we POSTed to a new location. Cheers! Your new entry is at location/ID " + id_pointer, item: items});
        });
        id_pointer = id_pointer + 1
    }
});

app.delete('/items/:id?', function(req, res) {
    var inner_id = Number(req.params.id)
    if(req.params.id === undefined){
        return res.status(400).json({
            "error": "DELETE endpoint requires an ID, i.e. /items/ID."
        })
    }
    if (isNaN(inner_id)) {
        return res.status(400).json({
            "error": "Requested ID '" + req.params.id + "' is not a number."
        })
    }
    if(req.params.id > id_pointer){
        return res.status(400).json({
            "error": "The ID you requested to delete ("+inner_id+") did not exist in the list."
        })
    }
    else {
        Item.findOneAndRemove({
          id: inner_id
        },function(err, items) {
            if (err) {
                return res.status(500).json({
                    message: 'Internal Server Error: '+err
                });
            }
            res.json({status: "Successfully deleted something", item: items});
        })
    }
});

app.use('*', function(req, res) {
    res.status(404).json({
        message: 'Not Found'
    });
});


exports.app = app;
exports.runServer = runServer;