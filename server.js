var express = require('express');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');

var config = require('./config');

var app = express();

app.use(bodyParser.json());
app.use(express.static('public'));

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

var Item = require('./models/item');

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
        res.status(400).json({
            "error": "Your request appears invalid. Please pass valid JSON in the form of {name: item}."
        })
    }
    else {
        if (id_pointer > req.body.id || id_pointer > req.params.id){
            res.status(400).json({
                "error": "The ID you've specified already exists. POSTing is intended for new entries, not replacing one. Please try REPLACE instead."
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
                res.status(201).json({ status: "Successfully deleted something", item: item});
            });
            id_pointer = real_id + 1
        }
    }
});

app.put('/items/:id?', function(req, res) {
    var g = Item.where({ name: req.body.replace });
    g.update({ name: req.body.name }, function(err, items) {
        if (err) {
            return res.status(500).json({
                message: 'Internal Server Error'
            });
        }
        res.json(items);
    });
});

app.delete('/items/:id?', function(req, res) {
    if(req.params.id && req.body_target_id && req.params.id !== req.body_target_id){
        return res.status(400).json({
            message: 'Choose ONE ID to target at a time, not disparate IDs in the JSON and endpoint'
        });
    }
    var real_target = req.params.id | req.body_target_id;
    Item.findOneAndRemove({
      id: real_target
    },function(err, items) {
        if (err) {
            return res.status(500).json({
                message: 'Internal Server Error'
            });
        }
        res.json(items);
    });
});

app.use('*', function(req, res) {
    res.status(404).json({
        message: 'Not Found'
    });
});


exports.app = app;
exports.runServer = runServer;