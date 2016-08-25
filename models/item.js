var mongoose = require('mongoose');

var ItemSchema = new mongoose.Schema({
    name: { type: String, required: true },
    id: { type: Number, required: false}
});

var Item = mongoose.model('Item', ItemSchema);

module.exports = Item;

module.exports.listOne = function(in_name, res) {
  Item.findOne({name: in_name}, function(err, matches) {
    if(err){
        res.send({error: err})
    }
    res.send(matches);
  });
}