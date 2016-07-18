var express = require('express');
var express = require('express');
var router = express.Router();

/* GET users listing. */
router.get('/', function (req, res) {
    res.render('Jade1');
});
router.get('/:id', function (req, res) {
    res.send(req.params.id);
});

/* POST*/

router.post("/", function (req, res) {
    res.send("OK");
});

module.exports = router;