const express = require('express');
const router = express.Router();
const Product = require('../models/Product')
const Category = require('../models/Category')
const fileUpload = require('../middleware/fileUpload')
const mongoose = require('mongoose')

router.get('/', fileUpload.single('productImg'), async function(req, res, next) {
    const produc = await Product.find()
        // await Promise.all(produc.map(async(m) => (await m.populate('categoryId'))))
    const category = await Category.find()
    const categoryProduct = await Promise.all(category.map(async(category) => {
        let products = await Category.aggregate([{
                $match: {
                    _id: mongoose.Types.ObjectId(category._id),
                },

            },
            {
                $lookup: {
                    from: "products",
                    localField: "_id",
                    foreignField: "categoryId",
                    as: "mahsulotlar",
                },
            },
        ]);
        products = products[0].mahsulotlar;
        return { products }
    }))
    res.render('index', {
        title: 'Express',
        produc,
        category,
        categoryProduct,
        searchInput: true
    });
});
router.get('/view/:id', async(req, res) => {
    const { categoryName } = await Category.findById(req.params.id);
    const category = await Category.find()
    let products = await Category.aggregate([{
            $match: {
                _id: mongoose.Types.ObjectId(req.params.id),
            },
        },
        {
            $lookup: {
                from: "products",
                localField: "_id",
                foreignField: "categoryId",
                as: "mahsulotlar",
            },
        },
        {
            $unwind: {
                path: "$mahsulotlar",
            },
        },
        {
            $group: {
                _id: {
                    _id: "$_id",
                },
                mahsulotlar: {
                    $push: "$mahsulotlar",
                },
            },
        },
        {
            $project: {
                _id: "$id._id",
                productName: "$_id.productName",
                productText: "$_id.productText",
                productSyntax: "$_id.productSyntax",
                productImg: "$_id.productImg",
                mahsulotlar: "$mahsulotlar",

            },
        },
    ]);
    if (products.length > 0) {
        products = products[0].mahsulotlar;
        res.render('clientCategory', {
            layout: 'layout',
            products,
            categoryName,
            category,
        })
    } else {
        res.redirect('/')
    }
})
router.get('/read/:id', async(req, res) => {
    const pro = await Product.findById(req.params.id)
        // console.log(req.body);
    res.render('attributeView', {
        productName: pro.productName,
        productText: pro.productText,
        productSyntax: pro.productSyntax,
        productImg: pro.productImg,
        pro
    })
})
router.post("/getUsers", async(req, res) => {
    let payload = req.body.payload.trim();
    let search = await Product.find({
        productName: {
            $regex: new RegExp("^" + payload + ".*", "i"),
        },
    }).exec();
    search = search.slice(0, 10);
    res.send({
        payload: search,
    });
});
module.exports = router;