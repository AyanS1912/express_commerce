const port = 5000
const express = require('express')
const app = express()
const fs = require('fs')
const path = require('path')

app.use(express.json()) 
app.listen(port,() => {
    console.log('App running on local port 5000')
})

/** Products methods */
app.get('/',(req,res) => {

    fs.readFile(path.join("products.json"), 'utf8', (err, data) => {
        if (err) throw new Error('Unable to fetch data.');
        res.send(JSON.parse(data));
    });
})

app.get('/product',(req,res) => {
    fs.readFile(path.join("products.json"),'utf8',(err,data) => {
        if(err) throw new Error("Unable to fetch product data")
        const product = JSON.parse(data);
        const productId = parseInt(req.query.id);
        const requiredData = product.find(product => product.id === productId);

        if (!requiredData) {
            return res.status(404).send("Product not found");
        }
        
        res.send(requiredData);
    })
})

// Function to find the next available id
function getNextId(products) {
    if (products.length === 0) {
        return 1; // If no products exist, start with id 1
    } else {
        // Find the maximum id and increment it by 1
        return Math.max(...products.map(product => product.id)) + 1;
    }
}

// It adds new product to dataset
app.post('/addProduct',(req,res) => {
    const { name, desc, price, stock, img} = req.query
    
    if(!name || !price || !stock){
        return res.status(400).send("name, price, stock are required fields.")
    }

    fs.readFile(path.join('products.json'),'utf8',(err,data) =>{
        if(err) throw new Error("Unable to read data.")

        let products = JSON.parse(data)
        const id = getNextId(products)

        const newProduct = {
            id: id,
            name: name,
            desc : desc || '',
            price : parseFloat(price),
            stock : parseInt(stock),
            img : img || ''
        }

        products.push(newProduct);

        fs.writeFile(path.join("products.json"), JSON.stringify(products), 'utf8', (err) => {
            if (err) throw new Error("Unable to add product")   
            res.status(201).send("Product added successfully")
        })
    })


})

/** Update an exisiting product details */
app.put('/updateProduct/:id',(req,res) =>{
    const productId = parseInt(req.params.id)
    console.log(req.body)
    fs.readFile("products.json",'utf8', (err,data) => {
        if (err) {
            return res.status(500).send('Unable to read products data.')
        }
        let products = JSON.parse(data)
        let product = products.find(product => product.id === productId)
        
        if(!product) {            
            return res.status(404).send('Product not found.')
        }
        
        product.name = req.body.name || product.name 
        product.desc =   req.body.desc || product.desc 
        product.stock = req.body.stock || product.stock
        product.price =  req.body.price || product.price 
        product.img = req.body.price ||  product.img

        fs.writeFile("products.json",JSON.stringify(products),'utf8',(err) => {
            if(err){
                return res.status(304).send("Update of data failed.")
            }
            res.status(200).send('Product detailed modified.')
        })
    })
})


// Removes a product
app.delete('/deleteProduct/:id', (req, res) => {
    
    const productId = parseInt(req.params.id)

    fs.readFile("products.json", 'utf8', (err, data) => {
        if (err) {
            return res.status(500).send('Unable to read products data.')
        }
        
        let products = JSON.parse(data)
        const indexToDelete = products.findIndex(product => product.id === productId);
        if (indexToDelete === -1) {            
            return res.status(404).send('Product not found.')
        }

        products.splice(indexToDelete, 1)

        fs.writeFile("products.json", JSON.stringify(products), 'utf8', (err) => {
            if (err) {
                return res.status(500).send(`Failed to delete product with id ${productId}.`)
            }
            return res.status(200).send('Product removed successfully.')
        })
    })
})


/** Order Methods */
// Returns all the orders
app.get('/order',(req,res) => {

    fs.readFile(path.join("order.json"),'utf8',(err,data) => {
        if(err) throw new Error("Unable to fecth Orders data")
        res.send(JSON.parse(data))
    })
})

//Retrieve the order with specific id
app.get('/order/:id',(req,res) => {
    fs.readFile(path.join("order.json"),'utf8',(err,data) => {
        if(err) throw new Error("Unable to fecth Orders data")
        const order = JSON.parse(data);
        const orderId = parseInt(req.params.id);
        const requiredData = order.find(ord => ord.id === orderId);

        if (!requiredData) {
            return res.status(404).send("Order not found");
        }
        
        res.send(requiredData);
    })
})

// To place a new Order
app.post('/addOrder',(req,res) => {
    const { address, product_id, total_count, delivery_status } = req.query

    if (!address || !product_id || !total_count || !delivery_status) {
        console.log(address,product_id,total_count,delivery_status)
        return res.status(400).send("address, product_id, total_count, and delivery_status are required fields.");
    }

    fs.readFile(path.join('order.json'),'utf8',(err,data) =>{
        if(err){
            return res.status(500).send("Unable to read data.");
        }

        let orders = JSON.parse(data)
        const orderId = getNextId(orders)
        const currentDate = new Date().toISOString().split('T')[0];
        const newOrder = {
            id: orderId,
            date: currentDate,
            address: address,
            product_id: product_id,
            total_count: total_count,
            delivery_status: delivery_status
        }

        orders.push(newOrder);

        fs.writeFile(path.join("order.json"), JSON.stringify(orders),'utf8', (err) => {
            if (err) throw new Error("Unable to add product")   
            res.status(201).send("Order placed successfully")
        })
    })


})

/** Retirve the delivery stataus of Order */
app.get('/order/:id/deliveryStatus', (req, res) => {
    const orderId = parseInt(req.params.id);

    fs.readFile("order.json", 'utf8', (err, data) => {
        if (err) {
            return res.status(500).send('Unable to read orders data.');
        }

        const orders = JSON.parse(data);
        const order = orders.find(order => order.id === orderId);
        if (!order) {
            return res.status(404).send('Order not found.');
        }

        res.status(200).send({ delivery_status: order.delivery_status });
    });
});

/** Retrieve Result based on given keyword queries */
app.get('/products/search', (req, res) => {
    const { query } = req.query;
    fs.readFile("products.json", 'utf8', (err, data) => {
        if (err) {
            return res.status(500).send('Unable to read products data.');
        }

        const products = JSON.parse(data);
        const matchingProducts = products.filter(product => {
            return product.name.toLowerCase().includes(query.toLowerCase()) ||
                   product.desc.toLowerCase().includes(query.toLowerCase());
        });

        res.status(200).send(matchingProducts);
    });
});


// To cancel an order by ID
app.post('/order/:id/cancel', (req, res) => {
    const orderId = parseInt(req.params.id)

    fs.readFile("order.json", 'utf8', (err, data) => {
        if (err) {
            return res.status(500).send('Unable to read orders data.')
        }

        let orders = JSON.parse(data);
        const orderIndex = orders.findIndex(order => order.id === orderId)

        if (orderIndex === -1) {
            return res.status(404).send('Order not found.')
        }

        const order = orders[orderIndex]

        // Check delivery status
        if (order.delivery_status === 'Pending') {
            orders.splice(orderIndex, 1)
            fs.writeFile("order.json", JSON.stringify(orders), 'utf8', (err) => {
                if (err) {
                    return res.status(500).send('Failed to cancel order.')
                }
                return res.status(200).send('Order cancelled successfully.')
            });
        } else if (order.delivery_status === 'Delivered') {
            orders[orderIndex].delivery_status = 'Returning'
        
            fs.writeFile("order.json", JSON.stringify(orders), 'utf8', (err) => {
                if (err) {
                    return res.status(500).send('Failed to update delivery status.')
                }
                return res.status(200).send('Your order will be picked up soon by our delivery agent.')
            })
        } else {
            return res.status(400).send('Invalid delivery status.')
        }
    });
});

// Proceed to checkout a product by placing order
app.post('/checkout', (req, res) => {
    const productId = parseInt(req.query.id)
    const no_items = parseInt(req.query.no_items)

    if(no_items<0){
        return res.status(400).send("Order quantity should be more than one.")
    }
    fs.readFile("products.json", 'utf8', (err, data) => {
        if (err) {
            return res.status(500).send('Unable to read products data.')
        }

        const products = JSON.parse(data);
        const product = products.find(product => product.id === productId)

        if (!product) {
            return res.status(404).send('Product not found')
        }

        else if (product.stock === 0) {
            return res.status(404).send('Out of Stock')
        }

        else if (product.stock < no_items) {
            return res.status(404).send('Selected no of quantity is not available.')
        }

        fs.readFile("order.json", 'utf8', (err, data) => {
            if (err) {
                return res.status(500).send('Unable to read orders data.')
            }

            let orders = JSON.parse(data)

            const orderId = getNextId(orders)
            const currentDate = new Date().toISOString().split('T')[0]
            const newOrder = {
                id: orderId,
                date: currentDate,
                address: req.query.address || '', 
                product_id: productId,
                delivery_status: 'Pending',
                total_count: no_items,
            }

            orders.push(newOrder)

            product.stock -= no_items;

            fs.writeFile("order.json", JSON.stringify(orders), 'utf8', (err) => {
                if (err) {
                    return res.status(500).send('Failed to create order.')
                }
                fs.writeFile("products.json", JSON.stringify(products), 'utf8', (err) => {
                    if (err) {
                        return res.status(500).send('Failed to update product stock.')
                    }
                    return res.status(201).send('Order placed successfully.')
                })
            })
        })
    })
})
