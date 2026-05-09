const Listing = require("../models/listing.js");
const { listingSchema } = require("../schema.js");
const ExpressError = require("../utils/ExpressError.js"); 


const escapeRegex = (text) => {
    return text.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
};

module.exports.index = async (req, res) =>
{
    const { search, filter } = req.query;
    const query = [];
    
    if (search && search.trim().length) {
        const regex = new RegExp(escapeRegex(search.trim()), "i");
        query.push({
            $or: [
                { title: regex },
                { description: regex },
                { location: regex },
                { country: regex },
            ],
        });
    }

    const filterMap = {
        trending: { title: /./ },
        hotels: { $or: [{ title: /hotel|resort|inn|stay/i }, { description: /hotel|resort|inn|stay/i }] },
        "iconic-cities": { $or: [{ title: /city|capital|landmark|urban|iconic/i }, { description: /city|capital|landmark|urban|iconic/i }] },
        mountains: { $or: [{ title: /mountain|hills|peak|alp/i }, { description: /mountain|hills|peak|alp/i }] },
        beaches: { $or: [{ title: /beach|coast|island|sea|shore/i }, { description: /beach|coast|island|sea|shore/i }] },
        castles: { $or: [{ title: /castle|fort|palace/i }, { description: /castle|fort|palace/i }] },
        "amazing-pools": { $or: [{ title: /pool|villa|waterfront/i }, { description: /pool|villa|waterfront/i }] },
        camping: { $or: [{ title: /camp|tent|campground|glamping/i }, { description: /camp|tent|campground|glamping/i }] },
        farms: { $or: [{ title: /farm|countryside|barn|estate/i }, { description: /farm|countryside|barn|estate/i }] },
        arctic: { $or: [{ title: /snow|ice|arctic|polar|north/i }, { description: /snow|ice|arctic|polar|north/i }] },
    };

    if (filter && filterMap[filter]) {
        query.push(filterMap[filter]);
    }

    let listings;
    if (query.length) {
        listings = await Listing.find({ $and: query });
    } else {
        listings = await Listing.find({});
    }
    res.render("listings/index.ejs", { listings, search: search || "", filter: filter || "" });
};

module.exports.renderNewForm = (req, res) =>
{
    res.render("listings/new.ejs");
};

module.exports.showListing = async (req, res) =>
{
    let { id } = req.params;
    const listing = await Listing.findById(id).populate({"path": "reviews", "populate": { "path": "author" }}).populate("owner");
    if(!listing){
        req.flash("Error", "Listing Does Not Exist!"); 
        res.redirect("/listings")
    }
    res.render("listings/show.ejs", { listing });
};

module.exports.createListing = async (req, res, next) =>
{   
    let url = req.file.path;
    let filename = req.file.filename;
    const newListing = new Listing(req.body.listing);
    newListing.owner = req.user._id;
    newListing.image = { url, filename };
    await newListing.save();
    req.flash("Success", "New Listing Created!"); 
    res.redirect("/listings");
};

module.exports.editListing = async (req, res) =>
{
    let { id } = req.params;
    const listing = await Listing.findById(id);
    if(!listing){
        req.flash("Error", "Listing Does Not Exist!"); 
        res.redirect("/listings")
    }
    res.render("listings/edit.ejs", { listing });
};

module.exports.renderEditForm = async (req, res) =>
{
    let { id } = req.params;
    const listing = await Listing.findById(id);
    if(!listing){
        req.flash("Error", "Listing Does Not Exist!"); 
        res.redirect("/listings")
    }
    let originalImageUrl = listing.image.url;
    originalImageUrl = originalImageUrl.replace("/upload", "/upload/w_300");
    res.render("listings/edit.ejs", { listing , originalImageUrl });
};

module.exports.updateListing = async (req, res) =>
{
    // if (!req.body.listing)
    // {
    //     throw new ExpressError(400, "Send valid data for listing");
    // };
    let { id } = req.params;
    let listing = await Listing.findByIdAndUpdate(id, { ...req.body.listing });
    if(typeof req.file !== "undefined"){
        let url = req.file.path;
        let filename = req.file.filename;
        listing.image = { url, filename };
        await listing.save();
    }
    req.flash("Success", "Listing Updated!"); 
    res.redirect(`/listings/${id}`);
};

module.exports.destroyListing = async (req, res) =>
{
    let { id } = req.params;
    let deletedListing = await Listing.findByIdAndDelete((id));
    req.flash("Success", "Listing Deleted!"); 
    res.redirect("/listings");
};