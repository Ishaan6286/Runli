import express from 'express';
import Product from '../models/Product.js';

const router = express.Router();

// Get all products
router.get('/', async (req, res) => {
    try {
        const products = await Product.find({});
        res.json(products);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// Seed products
router.post('/seed', async (req, res) => {
    try {
        await Product.deleteMany({});

        const products = [
            // Supplements - Protein
            {
                name: "Optimum Nutrition Gold Standard Whey Protein (2lbs)",
                category: "Protein Powder",
                price: 3099,
                displayPrice: "₹3,099",
                originalPrice: "₹3,899",
                image: "https://m.media-amazon.com/images/I/71OsEAdPuZL.jpg",
                rating: 4.5,
                reviews: 12453,
                affiliate: "https://www.amazon.in/s?k=optimum+nutrition+whey+protein"
            },
            {
                name: "MuscleBlaze Biozyme Performance Whey (1kg)",
                category: "Protein Powder",
                price: 2499,
                displayPrice: "₹2,499",
                originalPrice: "₹3,299",
                image: "https://m.media-amazon.com/images/I/71niFtvknxL._AC_UF1000,1000_QL80_.jpg",
                rating: 4.4,
                reviews: 8234,
                affiliate: "https://www.flipkart.com/search?q=muscleblaze+biozyme+whey"
            },
            {
                name: "Asitis Nutrition Atom Whey Protein (1kg)",
                category: "Protein Powder",
                price: 1799,
                displayPrice: "₹1,799",
                originalPrice: "₹2,399",
                image: "https://m.media-amazon.com/images/I/71rDa0LLphL.jpg",
                rating: 4.2,
                reviews: 5678,
                affiliate: "https://www.amazon.in/s?k=asitis+atom+whey+protein"
            },
            {
                name: "Nakpro Perform Whey Protein Concentrate (1kg)",
                category: "Protein Powder",
                price: 1299,
                displayPrice: "₹1,299",
                originalPrice: "₹1,999",
                image: "https://m.media-amazon.com/images/I/71lVwRf6kJL._AC_UF1000,1000_QL80_.jpg",
                rating: 4.1,
                reviews: 3421,
                affiliate: "https://www.amazon.in/s?k=nakpro+whey+protein"
            },
            {
                name: "Bigmuscles Nutrition Premium Gold Whey (1kg)",
                category: "Protein Powder",
                price: 1499,
                displayPrice: "₹1,499",
                originalPrice: "₹2,199",
                image: "https://www.bigmusclesnutrition.com/cdn/shop/files/B084H8LWC3.MAIN.jpg?v=1755233539",
                rating: 3.9,
                reviews: 4567,
                affiliate: "https://www.flipkart.com/search?q=bigmuscles+gold+whey"
            },

            // Supplements - Creatine
            {
                name: "Optimum Nutrition Micronized Creatine (250g)",
                category: "Creatine",
                price: 999,
                displayPrice: "₹999",
                originalPrice: "₹1,299",
                image: "https://m.media-amazon.com/images/I/61mQAPUdgmL._AC_UF1000,1000_QL80_.jpg",
                rating: 4.7,
                reviews: 5678,
                affiliate: "https://www.amazon.in/s?k=optimum+nutrition+creatine"
            },
            {
                name: "MuscleBlaze Creatine Monohydrate (100g)",
                category: "Creatine",
                price: 499,
                displayPrice: "₹499",
                originalPrice: "₹699",
                image: "https://m.media-amazon.com/images/I/711l1FkCLaL.jpg",
                rating: 4.4,
                reviews: 3421,
                affiliate: "https://www.flipkart.com/search?q=muscleblaze+creatine"
            },
            {
                name: "Asitis Nutrition Creatine Monohydrate (250g)",
                category: "Creatine",
                price: 689,
                displayPrice: "₹689",
                originalPrice: "₹999",
                image: "https://asitisnutrition.com/cdn/shop/files/ATOM_Creatine_100_gms_Mint_Mojit_front_image_1_1.jpg?v=1763988700&width=600",
                rating: 4.3,
                reviews: 2345,
                affiliate: "https://www.amazon.in/s?k=asitis+creatine"
            },
            {
                name: "Nutrabay Pure Creatine Monohydrate (100g)",
                category: "Creatine",
                price: 399,
                displayPrice: "₹399",
                originalPrice: "₹599",
                image: "https://cdn2.nutrabay.com/uploads/variant/images/variant-29179-featured_image-Nutrabay_Pure_Creatine_Monohydrate_Micronized__400_gm_088_Lb_Unflavoured.png",
                rating: 4.2,
                reviews: 1234,
                affiliate: "https://www.amazon.in/s?k=nutrabay+creatine"
            },

            // Supplements - Pre-Workout
            {
                name: "Cellucor C4 Pre-Workout (30 Servings)",
                category: "Pre-Workout",
                price: 2199,
                displayPrice: "₹2,199",
                originalPrice: "₹2,999",
                image: "https://dukaan.b-cdn.net/700x700/webp/media/958c239e-62f3-4346-9537-9c79c18bfb4c.png",
                rating: 4.6,
                reviews: 4567,
                affiliate: "https://www.amazon.in/s?k=c4+pre+workout"
            },
            {
                name: "MuscleBlaze Pre-Workout 200 (100g)",
                category: "Pre-Workout",
                price: 799,
                displayPrice: "₹799",
                originalPrice: "₹1,199",
                image: "https://img10.hkrtcdn.com/37799/prd_3779899-MuscleBlaze-PRE-Workout-200-Xtreme-0.22-lb-Berry-Bolt_o.jpg",
                rating: 4.2,
                reviews: 2134,
                affiliate: "https://www.flipkart.com/search?q=muscleblaze+pre+workout"
            },
            {
                name: "Bigmuscles Nutrition Freak Pre-Workout",
                category: "Pre-Workout",
                price: 699,
                displayPrice: "₹699",
                originalPrice: "₹999",
                image: "https://m.media-amazon.com/images/I/71uBJ22vlCL.jpg",
                rating: 4.0,
                reviews: 1567,
                affiliate: "https://www.amazon.in/s?k=bigmuscles+pre+workout"
            },

            // Nutrition - Bars
            {
                name: "RiteBite Max Protein Bars (Pack of 6)",
                category: "Protein Bars",
                price: 599,
                displayPrice: "₹599",
                originalPrice: "₹750",
                image: "https://maxprotein.in/cdn/shop/products/Max_Protein_Active_Choco_Slim_Protein_bar_Front.png?v=1739264962",
                rating: 4.1,
                reviews: 1876,
                affiliate: "https://www.amazon.in/s?k=ritebite+protein+bars"
            },
            {
                name: "Yoga Bar Protein Bars Variety Pack (6)",
                category: "Protein Bars",
                price: 699,
                displayPrice: "₹699",
                originalPrice: "₹899",
                image: "https://onemg.gumlet.io/l_watermark_346,w_480,h_480/a_ignore,w_480,h_480,c_fit,q_auto,f_auto/cropped/cgd7ti8den5tfswzw4zr.png",
                rating: 4.3,
                reviews: 2345,
                affiliate: "https://www.flipkart.com/search?q=yoga+bar+protein"
            },
            {
                name: "MuscleBlaze Protein Bar (Pack of 6)",
                category: "Protein Bars",
                price: 499,
                displayPrice: "₹499",
                originalPrice: "₹720",
                image: "https://cpimg.tistatic.com/5125017/b/4/muscleblaze-protein-bar-22g-protein-12-piece-s-pack-almond-fudge.jpg",
                rating: 4.2,
                reviews: 1234,
                affiliate: "https://www.amazon.in/s?k=muscleblaze+protein+bar"
            },

            // Nutrition - Oats & Muesli
            {
                name: "Bagrry's Crunchy Muesli (1kg)",
                category: "Muesli",
                price: 399,
                displayPrice: "₹399",
                originalPrice: "₹550",
                image: "/products/muesli.png",
                rating: 4.4,
                reviews: 3456,
                affiliate: "https://www.amazon.in/s?k=bagrry+muesli"
            },
            {
                name: "Saffola Classic Masala Oats (500g)",
                category: "Oats",
                price: 185,
                displayPrice: "₹185",
                originalPrice: "₹210",
                image: "https://m.media-amazon.com/images/I/71nkYm2FpwL.jpg",
                rating: 4.2,
                reviews: 5678,
                affiliate: "https://www.flipkart.com/search?q=saffola+oats"
            },
            {
                name: "Quaker Oats (1kg)",
                category: "Oats",
                price: 199,
                displayPrice: "₹199",
                originalPrice: "₹240",
                image: "/products/muesli.png",
                rating: 4.5,
                reviews: 8901,
                affiliate: "https://www.amazon.in/s?k=quaker+oats"
            },
            {
                name: "Kellogg's Muesli with 21% Fruit & Nut (500g)",
                category: "Muesli",
                price: 290,
                displayPrice: "₹290",
                originalPrice: "₹360",
                image: "https://m.media-amazon.com/images/I/71d0wtpbxJL._AC_UF894,1000_QL80_.jpg",
                rating: 4.3,
                reviews: 4567,
                affiliate: "https://www.amazon.in/s?k=kelloggs+muesli"
            },

            // Accessories - Bags
            {
                name: "Boldfit Gym Bag with Shoe Compartment",
                category: "Gym Bags",
                price: 799,
                displayPrice: "₹799",
                originalPrice: "₹1,299",
                image: "/products/gym_bag.png",
                rating: 4.3,
                reviews: 2345,
                affiliate: "https://www.amazon.in/s?k=boldfit+gym+bag"
            },
            {
                name: "Nivia Beast Gym Bag",
                category: "Gym Bags",
                price: 599,
                displayPrice: "₹599",
                originalPrice: "₹999",
                image: "https://m.media-amazon.com/images/I/61FfzM5o4DL.jpg",
                rating: 4.1,
                reviews: 1567,
                affiliate: "https://www.flipkart.com/search?q=nivia+gym+bag"
            },
            {
                name: "Auxter Black Gym Bag",
                category: "Gym Bags",
                price: 349,
                displayPrice: "₹349",
                originalPrice: "₹999",
                image: "https://m.media-amazon.com/images/I/71xeudlt5EL._AC_UY1100_.jpg",
                rating: 4.0,
                reviews: 5678,
                affiliate: "https://www.amazon.in/s?k=auxter+gym+bag"
            },

            // Accessories - Grippers & Straps
            {
                name: "Strauss Adjustable Hand Gripper",
                category: "Hand Grippers",
                price: 199,
                displayPrice: "₹199",
                originalPrice: "₹399",
                image: "https://m.media-amazon.com/images/I/71VPm-x8lJL._AC_UF894,1000_QL80_.jpg",
                rating: 4.4,
                reviews: 3456,
                affiliate: "https://www.amazon.in/s?k=strauss+hand+gripper"
            },
            {
                name: "Boldfit Gym Straps",
                category: "Straps",
                price: 299,
                displayPrice: "₹299",
                originalPrice: "₹599",
                image: "https://m.media-amazon.com/images/I/71i5+KMmtXL.jpg",
                rating: 4.5,
                reviews: 2678,
                affiliate: "https://www.amazon.in/s?k=boldfit+gym+straps"
            },
            {
                name: "Kobo Heavy Duty Lifting Straps",
                category: "Straps",
                price: 249,
                displayPrice: "₹249",
                originalPrice: "₹450",
                image: "https://m.media-amazon.com/images/I/71qAKTnktXL._AC_UF894,1000_QL80_.jpg",
                rating: 4.2,
                reviews: 1234,
                affiliate: "https://www.amazon.in/s?k=kobo+lifting+straps"
            },

            // Accessories - Shakers
            {
                name: "Boldfit Gym Shaker Bottle 700ml",
                category: "Shakers",
                price: 249,
                displayPrice: "₹249",
                originalPrice: "₹399",
                image: "https://m.media-amazon.com/images/I/81hUtMxX8eL._AC_UF894,1000_QL80_.jpg",
                rating: 4.4,
                reviews: 4567,
                affiliate: "https://www.amazon.in/s?k=boldfit+shaker"
            },
            {
                name: "BlenderBottle Classic Shaker",
                category: "Shakers",
                price: 599,
                displayPrice: "₹599",
                originalPrice: "₹899",
                image: "https://m.media-amazon.com/images/I/51czYs5YISL.jpg",
                rating: 4.6,
                reviews: 6789,
                affiliate: "https://www.flipkart.com/search?q=blenderbottle+shaker"
            },
            {
                name: "Haans Shake It Up Shaker (500ml)",
                category: "Shakers",
                price: 149,
                displayPrice: "₹149",
                originalPrice: "₹299",
                image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSP5vCaL9Zze4Xd6YGnWE74-Vx7pfOhMmapQw&s",
                rating: 4.0,
                reviews: 987,
                affiliate: "https://www.amazon.in/s?k=haans+shaker"
            }
        ];

        await Product.insertMany(products);
        res.json({ message: 'Products seeded successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
});

export default router;
