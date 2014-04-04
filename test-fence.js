runInFence = function (f) {
  var fence = new DDPServer._WriteFence();
  DDPServer._CurrentWriteFence.withValue(fence, f);
  fence.armAndWait();
};

if (Meteor.isServer) {
  var Posts = new Meteor.Collection('Posts');
  var Persons = new Meteor.Collection('Persons');

  var postId = Posts.insert({
    nested: [
      {
        body: 'NestedFooBar'
      }
    ],
    tags: [
      'tag'
    ]
  });

  Posts.find({}).observeChanges({
    changed: function (id, fields) {
      Meteor._sleepForMs(100);
      Posts.update(postId, {$set: {tags: []}});
    }
  });

  var personId = Persons.insert({
    foo: 'Bar'
  });

  Persons.find({}).observeChanges({
    removed: function (id) {
      Meteor._sleepForMs(100);
      Posts.update(postId, {$set: {nested: []}});
    }
  });
  
  runInFence(function () {
    Persons.remove(personId);
  });

  console.log(Posts.findOne(postId));

  if (Posts.findOne(postId).tags.length) throw new Error("Invalid tags, bug");

  console.log("No bug");
}
