//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");


const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

try{
mongoose.connect("mongodb://127.0.0.1:27017/todolistDB")
}catch(err){
  if(err){
    console.log(err);
  }else{
    console.log("successful");
  }
}
const itemsSchema = {
  name: String,
};

const Item = mongoose.model("Item", itemsSchema); //created collection items as plural hojaega in db

const listSchema = {
  name: String,
  items: [itemsSchema],
};

const List = mongoose.model("List", listSchema);

const item1 = new Item ({
  name: "Welcome to your To Do List!",
});

const item2 = new Item({
  name: "Hit + button",
});

const item3 = new Item({
 name: "<-- hit this to delete",
});

const defaultItems = [item1, item2, item3];





app.get("/", async function (req, res) {
  try {
    const foundItems = await Item.find({});
    if (foundItems.length === 0) {
      await Item.insertMany(defaultItems);
      console.log("Default items inserted successfully.");
      res.redirect("/"); 
    } else {
      res.render("list", {
        listTitle: "Today",
        newListItems: foundItems
      });
    }
  } catch (error) {
    console.error("Error inserting default items:", error);
  }
});

app.get("/:customListName", async function(req, res){
  const customListName = _.capitalize(req.params.customListName);

  
    const found = await List.findOne({name: customListName});
    if(found){ //opening list if already exists
      res.render("list", {listTitle: found.name, newListItems: found.items});
    }else{
      const list = new List({  //creating if the list does not exist
        name: customListName,
        items: defaultItems,
      });
    await list.save();
    console.log("custom list created");
    res.redirect("/"+customListName);
    } 
  
});


app.post("/", async function(req, res){

  const listName = req.body.list ; //getting value of button or say title of the list , see in list.ejs

  const itemName = new Item({
    name: req.body.newItem ,
  });

  if(listName === "Today"){  //checking if it is default list
    await itemName.save(); //saved it to mongoDb
  res.redirect("/"); //so that newly added item will be dislpayed as / displays by finding all 
  }else{

    const foundList = await List.findOne({ name: listName });
      
    if (foundList) {
      foundList.items.push(itemName);
      await foundList.save();
      res.redirect("/" + listName);
    } else {
      console.log("Custom list not found");
      res.redirect("/");
    }
  }


});

app.post("/delete", async function(req,res){
   const checkedItemId = req.body.checkbox; 
   const listName = req.body.listName;

   if(listName === "Today"){
    await Item.findByIdAndRemove(checkedItemId);
    console.log("successfully removed");
    res.redirect("/");
   }else{
   await List.findOneAndUpdate({name: listName}, {$pull : {items: {_id: checkedItemId}}});
   res.redirect("/"+listName);
   }
});


app.get("/work", function(req,res){
  res.render("list", {listTitle: "Work List", newListItems: workItems});
});

app.get("/about", function(req, res){
  res.render("about");
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
