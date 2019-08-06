import firebase from 'firebase/app'
import 'firebase/firestore'
import 'firebase/auth'
import FirebaseService from '@/services/FirebaseService'

const POSTS = 'posts'
const PORTFOLIOS = 'portfolios'
const TAGS = 'tags'
const TOKENS = 'tokens'

// Setup Firebase
const config = {
  apiKey: "AIzaSyDeOmVEnsytGy8tgl1QjLdLLuMEru36Aak",
  authDomain: "team3-435f1.firebaseapp.com",
  databaseURL: "https://team3-435f1.firebaseio.com",
  projectId: "team3-435f1",
  storageBucket: "team3-435f1.appspot.com",
  messagingSenderId: "804761067334",
  appId: "1:804761067334:web:de1801641a9f3ddc"
};


var app = firebase.initializeApp(config)
var db = firebase.firestore(app)
var firestore = firebase.firestore()

firebase.firestore().enablePersistence()
  .catch(function(err) {
      if (err.code == 'failed-precondition') {
          // Multiple tabs open, persistence can only be enabled
          // in one tab at a a time.
          // ...
      } else if (err.code == 'unimplemented') {
          // The current browser does not support all of the
          // features required to enable persistence
          // ...
      }
  });

  db.collection("cities").where("state", "==", "CA")
  .onSnapshot({ includeMetadataChanges: true }, function(snapshot) {
      snapshot.docChanges().forEach(function(change) {
          if (change.type === "added") {
              console.log("New city: ", change.doc.data());
          }

          var source = snapshot.metadata.fromCache ? "local cache" : "server";
          console.log("Data came from " + source);
      });
  });

  
//FCM PUSH
//Get firebase messaging function
const messaging = firebase.messaging();
//Set VApiIdKey
messaging.usePublicVapidKey("BMuvOdnou4GfoVG_8fSmde7sbnnFOvgMaEp7qn2vlZ5qHxF4HvGVqGz7Jrvc6NdP7KCij8fRgfyUsLUfg0M-a0g");

//Request notification permission
messaging.requestPermission()
  .then(function() {
    console.log("WE HAVE PERMISSION");
    return messaging.getToken();
  })
  //If messaging called with token
  .then(function(token){
    console.log("TOKEN IS : " + token)
    //Save token into firestore database
    FirebaseService.saveTokens(token)
    //TODO : need to check admin
  })
  .catch(function(err) {
    console.log("Error occuered in RP")
  });

// Get push in foreground status. payload = push notification
  messaging.onMessage(function(payload){
  console.log('onMessage: ', payload);
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
  };
  if (Notification.permission === "granted") {
    var notification = new Notification(notificationTitle, notificationOptions);
  }
});


export default {
  async getTokens() { 
    console.log("getTokenSequence")
    const tokenbox = []
    await firestore.collection(TOKENS)
    .get()
    .then((docSnapshots) => {
      docSnapshots.forEach((doc) => {
        tokenbox.push(doc.data().token)
      })
    })
    .catch(function(err){
      console.log("Get Tokens fail : " + err)
    })
    console.log("tokenbox : " + tokenbox)
    return tokenbox
  },
  saveTokens(token) {
    console.log("saveTokenSequence")
    console.log("Token id is : " + token)
    firestore.collection(TOKENS).doc(token).set({
      token,
    })
    .then(function(){
      console.log("Save token success")
    })
    .catch(function(err){
      console.log("Save token failed : " + err)
    })
  },

  saveTokenInRt(token){
    var cbGetToekn = function (token) {
      console.log('setLogin fcmId get : ', token);
      var userUid = this.auth.currentUser.uid;
      var fcmIdRef = this.database.ref('FcmId/' + userUid);
      fcmIdRef.set(token);
  }
    firebase.messaging().getToken()
      .then(cbGetToekn.bind(this))
      .catch(function (e) {
      })
  },
  async pushBullet(id){
    console.log(id)
    var tokenList = await FirebaseService.getTokens()
      .then(function(result) {
        result.forEach(function(singleToken) {
          FirebaseService.ShotPushMessage(singleToken, id)
        })
      }
    )
  },
  ShotPushMessage(to, userId) {
    console.log("Shot to : " + to)
    var request = require("request");
    request.post({
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'key=AAAAu19_X0Y:APA91bGKLCeCLA5KTw0l46bDqDV4wbreffDvajZRN3oW9_cgCLhzAOgYDSKpGFpIluuM2Jh8goPrFgLTqb0iT3mgUFyPBHg5abXDVX8Kw2syBXa9jV6PHSojlsv2IuF28E2TB1uy1Qvn'
      },
      uri: "https://fcm.googleapis.com/fcm/send",
      body: JSON.stringify({
        "to": to,
        "notification": {
          "title": "새글 알림",
          "body": userId + "님이 글을 쓰셨습니다"
        }
      })
    }, function (error, response, body) {
      console.log(body);
    });
  },
  getPosts() {
    const postsCollection = firestore.collection(POSTS)
    return postsCollection
      .orderBy('created_at', 'desc')
      .get()
      .then((docSnapshots) => {
        return docSnapshots.docs.map((doc) => {
          let data = doc.data()
          // Get firestore documentID
          data.id = doc.id;
          data.created_at = new Date(data.created_at.toDate())
          return data
        })
      })
  },
  async postPost(user, title, body, id, tag) {
    FirebaseService.pushBullet(user)
    var date = new Date()
    /* Check id
          if id != null : it is exist POST
          if id == null : it is new POST */ 
    if(id != null) {
      //이전 태그를 아니깐, 지우는거 처리
      var tmp = await this.deleteTag(id);
      firestore.collection(POSTS).doc(id).set({
        user,
        title,
        body,
        created_at: date,//firebase.firestore.FieldValue.serverTimestamp(),
        tag
      }).then(function(){
        console.log("Modify post succeed")
        tag.forEach(async tagg => {
          let curtag = firestore.collection(TAGS).doc(tagg)
          var temp = tagg
          const doc = await curtag.get()
          if (doc.exists){
            var data = doc.data();
            data.postlist = data.postlist.concat([id]);
            firestore.collection(TAGS).doc(temp).set({
              postlist : data.postlist
            })
          }
          else{
            firestore.collection(TAGS).doc(temp).set({
              postlist : [id]
            })
          }
        })
      }).catch(function() {
        console.error("Modify post failed")
      });
    }
    else{
      firestore.collection(POSTS).add({
        user,
        title,
        body,
        created_at: firebase.firestore.FieldValue.serverTimestamp(),
        tag
      }).then(ref=>{
        console.log("Post post succeed")
        var id = ref.id
        tag.forEach(async tagg => {
          let curtag = firestore.collection(TAGS).doc(tagg)
          var temp = tagg
          const doc = await curtag.get()
          if (doc.exists){
            var data = doc.data();
            data.postlist = data.postlist.concat([id]);
            firestore.collection(TAGS).doc(temp).set({
              postlist : data.postlist
            })
          }
          else{
            firestore.collection(TAGS).doc(temp).set({
              postlist : [id]
            })
          }
        })
      }).catch(function() {
        console.error("Post post failed")
      });
    }
  },

  async deletePost(id){
    var cons = await this.deleteTag(id);
    firestore.collection(POSTS).doc(id).delete().then(function() {
      console.log("Delete post succeed(firestore)")
    }).catch(function() {
      console.error("Delete post error(firestore)")
    });
  },

  async asyncForEach(array, callback){
    for (let index = 0; index < array.length; index++) {
      await callback(array[index], index, array);
    }
  },
  async deleteTag(id){
    var beforepost = firestore.collection(POSTS).doc(id)
    const beforedoc = await beforepost.get()
    var data = beforedoc.data();
    var beforetag = data.tag

    await this.asyncForEach(beforetag, async (tagg) => {
      let tag2 = firestore.collection(TAGS).doc(tagg)
      const doc = await tag2.get()
      var data = doc.data();
      var index = data.postlist.indexOf(id);
      data.postlist.splice(index, 1);
      // console.log(data.postlist);
      if (data.postlist.length>0){
        await firestore.collection(TAGS).doc(tagg).set({
          postlist : data.postlist
        })
      }
      else{
        await firestore.collection(TAGS).doc(tagg).delete();
      }
    });
  },
  getPortfolios() {
    const portsCollection = firestore.collection(PORTFOLIOS)
    return portsCollection
      .orderBy('created_at', 'desc')
      .get()
      .then((docSnapshots) => {
        return docSnapshots.docs.map((doc) => {
          let data = doc.data()
          // console.log(data);
          // Get firestore documentID

          data.id = doc.id;
          data.created_at = new Date(data.created_at.toDate())
          return data
        })
      })
  },
  postPortfolio(user, title, body, img, id, avatar, nickname) {
    FirebaseService.pushBullet(user)  
    var date = new Date()
    console.log("here is avatar : "+  avatar)
    if(id != null) {
      firestore.collection(PORTFOLIOS).doc(id).set({
        user,
        title,
        body,
        img,
        avatar,
        nickname,
        created_at: date, //firebase.firestore.FieldValue.serverTimestamp(),
      }).then(function(){
        console.log("Modify portfolio succeed")
      }).catch(function() {
        console.error("Modify portfolio failed")
      });
    }
    else{
      firestore.collection(PORTFOLIOS).add({
        user,
        title,
        body,
        img,
        avatar,
        nickname,
        created_at: date//firebase.firestore.FieldValue.serverTimestamp()
      }).then(function(){
        console.log("Post portfolio succeed")
      }).catch(function() {
        console.error("Post portfolio failed")
      });
    }
  },
  deletePortfolio(id, imgSrc){
    firestore.collection(PORTFOLIOS).doc(id).delete().then(function() {
      console.log("Delete portfolio succeed(firestore)")
    }).catch(function() {
      console.error("Delete portfolio error(firestore)")
    });
  },
  getPortfolio(id){
    let port =  firestore.collection(PORTFOLIOS).doc(id)
    return port.get()
      .then(doc => {
        var data = doc.data();
        data.created_at = new Date(data.created_at.toDate());
        data.id = doc.id;
        return data;
      });
  },
  async getPost(id){
    let post = firestore.collection(POSTS).doc(id)
    return post.get()
      .then(doc => {
        var data = doc.data();
        data.created_at = new Date(data.created_at.toDate());
        data.id = id;
        return data;
      })
  },
  getTag(id){
    let tag = firestore.collection(TAGS).doc(id)
    return tag.get()
      .then(doc => {
        if (doc.exists){
          var data = doc.data();
          return data;
        }
        else{
          return null;
        }
      })
  },
  getTags() {
    const tagsCollection = firestore.collection(TAGS)
    return tagsCollection
      .get()
      .then((docSnapshots) => {
        return docSnapshots.docs.map((doc) => {
          let data = doc.data()
          // Get firestore documentID
          data.id = doc.id;
          return data
        })
      })
  },
  async deletePortLike(portid, useremail){
    await firestore.collection('portfolios').doc(portid).collection('likeList').doc(useremail).delete();
    return true;
  },
  async addPortLike(portid, useremail){
    await firestore.collection('portfolios').doc(portid).collection('likeList').doc(useremail).set({
      created_at : firebase.firestore.FieldValue.serverTimestamp(),
    });
    return true;
  },
  checkPortLike(portid, useremail){
    const likes = firestore.collection('portfolios').doc(portid).collection('likeList').doc(useremail);
    return likes.get()
    .then(doc => {
      if (doc.exists){
        return true;
      }
      else{
        return false;
      }
    })
  },
  getPortLikeCount(portid){
    return firestore.collection(PORTFOLIOS).doc(portid).collection('likeList').get().then(snap => {
      return snap.size // will return the collection size
   });
  },
  getPortLikers(portid){
    const portsCollection = firestore.collection(PORTFOLIOS).doc(portid).collection('likeList')
    return portsCollection
      .orderBy('created_at','desc')
      .get()
      .then((docSnapshots) => {
        return docSnapshots.docs.map((doc) => {
          let data = doc.data()
          // Get firestore documentID
          data.user = doc.id;
          return data
        })
      })
  },
  async deletePostLike(postid, useremail){
    await firestore.collection(POSTS).doc(postid).collection('likeList').doc(useremail).delete();
    return true;
  },
  async addPostLike(postid, useremail){
    await firestore.collection(POSTS).doc(postid).collection('likeList').doc(useremail).set({
      created_at : firebase.firestore.FieldValue.serverTimestamp(),
    });
    return true;
  },
  checkPostLike(postid, useremail){
    const likes = firestore.collection(POSTS).doc(postid).collection('likeList').doc(useremail);
    return likes.get()
    .then(doc => {
      if (doc.exists){
        return true;
      }
      else{
        return false;
      }
    })
  },
  getPostLikeCount(postid){
    return firestore.collection(POSTS).doc(postid).collection('likeList').get().then(snap => {
      return snap.size // will return the collection size
   });
  },
  getPostLikers(postid){
    const postsCollection = firestore.collection(POSTS).doc(postid).collection('likeList')
    return postsCollection
      .orderBy('created_at','desc')
      .get()
      .then((docSnapshots) => {
        return docSnapshots.docs.map((doc) => {
          let data = doc.data()
          // Get firestore documentID
          data.user = doc.id;
          return data
        })
      })
  },
  curUser() {
    var user = firebase.auth().currentUser;
    return user;
  },
}
