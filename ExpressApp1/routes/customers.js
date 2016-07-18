var express = require('express');
var router = express.Router();
var nano = require('nano')('http://localhost:5984');
var dbName = "customermgmt1";
var db = null;
nano.db.list(function (err, body) {
    var isDBAvailable = false;
    // body is an array
    body.forEach(function (db) {
        if (db ==dbName) {
            isDBAvailable = true;
        }
       
    });
    if (!isDBAvailable) {
        nano.db.create(dbName, function (err, body) {
            if (!err) {
                console.log('database customermgmt created!');
                db = nano.db.use(dbName);
                db.insert({
                    "_id": "_design/customers",
                    
                    "views": {
                        "all": {
                            "map": "function(doc){if(doc.Type=='Customer')emit(doc._id,null);}"
                        },
                        "byFirstName": {
                            "map": "function(doc){if(doc.Type=='Customer')emit(doc.FirstName,null);}"
                        },
                        "byLastName": {
                            "map": "function(doc){if(doc.Type=='Customer')emit(doc.LastName,null);}"
                        },
                        "composite": {
                            "map": "function(doc){if(doc.Type=='Customer'){emit(doc._id,null);emit(doc.LastName,null);emit(doc.FirstName,null);emit(doc.Address.City,null);}}"
                        }
                    }
                }, null, function (err, body, header) {
                    
                    });
            }
        });
    }
});
db = nano.db.use(dbName);


/* GET customers listing. */
router.get('/', function (req, res) {
    db.view('customers', 'all', {  'include_docs': true }, function (err, body) {
        
       
        if (!err) {
            res.render('users', { CustomerList: body.rows });
        }
    
    });
   
});

/*Open the create new customer page*/
router.get('/create/', function (req, res) {
    res.render('createuser');
});


/*indesing on multiple key for same document as it will help in searching on various fields. View named composite has been created which search on if, firstName
 *lastname and city. Search result can be shortened by using limit and skip where limit is pagesize and skip is the pagesize* pageNumber */
/* Route for searching*/
router.get('/search/', function (req, res) {
    
    var searchTerm = req.query.searchTerm;
    if (searchTerm === undefined || searchTerm === null || searchTerm.trim() == '') {
        res.writeHead(400, { "Content-Type": "text/plain" });
        res.end("Bad Request.");
        return;
    }

    db.view('customers', 'composite', {  startkey: searchTerm, endkey: searchTerm + '\ufff0' ,'include_docs': true }, function (err, body) {
        
        if (!err) {
            res.render('users', { CustomerList: body.rows });

            
        }
    });
      
   
});




/* POST*/

router.post("/", function (req, res) {
   
    var customer = {};
    customer.Type = "Customer";
    

    customer.FirstName = req.body.firstName;
    customer.LastName = req.body.lastName;
    customer.Address = {};
    customer.Address.AddressLine1 = req.body.addressLine1;
    customer.Address.AddressLine2 = req.body.addressLine2;
    customer.Address.City = req.body.city;
    customer.Address.State = req.body.state;    
    customer.Address.Country = req.body.country;
    if (!validateCustomerModel(customer)) {
        res.writeHead(400, { "Content-Type": "text/plain" });
        res.end("Bad Request.");
        return;
    }

    db.insert(customer, null, function (err, body, header) {
    if (err) {
        response.writeHead(500, { "Content-Type": "text/plain" });
        response.end("Inserting customer failed. " + err + "\n");
    } else {
       // res.writeHead(200, { "Content-Type": "text/plain" });
        res.redirect('/customers')
    }
});
    //res.send("OK");
});

/* Validation method Here I am assuming firstName and Last Name are mandatory*/
function validateCustomerModel(customer){
    return (customer.FirstName !== undefined && customer.FirstName != null && customer.FirstName.length > 0) && (customer.LastName !== undefined && customer.LastName != null && customer.LastName.length > 0);
    
}
module.exports = router;