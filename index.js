var express = require('express');//get,post,put gibi API uç noktalarını kolayca kurmamıza yarayan paket
var session = require('express-session');//oturum verisi ve cookie yönetimi için kolaylık sağlayan paket
const Connection = require( 'database-js' ).Connection;//json dosyalarından veritabanı yapısı oluşturmaya ve sql yazmaya yarayan paket
var bodyParser = require('body-parser');//url ve json post verisini express ile çözümlemeye yarayan paket
var path = require('path');//dosya yollarını kolayca hazırlamak için gerekli olan paket
var fs = require('fs');//dosya okuma yazma işlemleri için
var md5 = require('md5');//güvenlik testlerinden geçebilmesi için şifrelerin sunucu tarafında bile görüntülememesi hash olarak kaydedilmesi için

//Veritabanı klasörü için güvenli, hesaplanması, tahmini ve hatırlanması zor özel keyimiz 
var dbDir = "1e44fbc7eeaf7b54c0f112768f4cb8df";

//Tablo konumlarımızı ayarlayalım
var tables = {
  'users' : dbDir + '/users.json',
  'projects' : dbDir + '/projects.json',
  'tasks' : dbDir + '/tasks.json'
};

//Express uygulamamızı tanımlayalım
var app = express();

//HTML dosyalarında veri gösterebilmek için ejs adlı taslak motorunu kullanacağız. Express tarafından varsayılan olarak desteklenir.
app.set('views', path.join(__dirname, 'views'));//views klasörünü html taslaklarımızı tuttuğumuz yer olarak belirliyoruz
app.set('view engine', 'ejs');//motoru ejs olarak seçiyoruz.

//Oturum
app.use(session({
	secret: '910faa5693876d9a99a4d71c36dd1b8d',//Oturum güvenliği için özel hesaplanması ve tahmini ve hatırlaması zor bir secret tanımlıyalım
	resave: true,
	saveUninitialized: true
}));
//Express uygulamamazı form verileri için json ve urlencoded bodyparser(çözümleyici) kullanacak şekilde hazırlayalım
app.use(bodyParser.urlencoded({extended : true}));
app.use(bodyParser.json());

//Veritabanı tablolarına bağlanma fonksiyonumuzu tanımlayalım
async function connectTable(table) {
  try {
      const connection = new Connection( 'json:///' + table);
      return connection;
  } catch (error) {
      console.log(error);
  }
};

//Veritabanı değişikliklerini kaydetmek için fonksiyonumuzu tanımlayalım
async function saveTable(connection, data) {
  //json ön ekini atıp dosyanın net konumunu bulalım
  var url = connection.URL.replace("json:///", '');

  //id değerlerini düzeltelim
  var lastId = -1;
  data.forEach(obj => {
    if(!obj.id){
      obj.id = lastId + 1;
    }
    
    lastId = obj.id;
  });
  //dosyaya yazalım
  fs.writeFile(url, JSON.stringify(data), (err) => {
    if (err) {
      console.log(err);
      return false;
    } else {
      return true;
    }
  });
}

//CSS ve JS veren hizmetlerimizi tanımlayalım
//CSS
app.get('/CSS/:cssId', function (request, response) {
  if(request.params.cssId.indexOf('.map') != -1){
    response.sendFile(path.join(__dirname + '/CSS/'+ request.params.cssId));
  }else{
    response.sendFile(path.join(__dirname + '/CSS/'+ request.params.cssId +'.css'));
  }
})
//JS
app.get('/JS/:jsId', function (request, response) {
  if(request.params.jsId.indexOf('.map') != -1){
    response.sendFile(path.join(__dirname + '/JS/'+ request.params.jsId));
  }else{
    response.sendFile(path.join(__dirname + '/JS/'+ request.params.jsId +'.js'));
  }
})

//doğrudan girişlerde login sayfası gönderelim
app.get('/', function(request, response) {
  if (request.session.loggedin) {
    response.redirect('/home');
    response.end();
    return; 
  }else{
    response.render('login/login');
  }
});

//Eğer login.ejs deki form doLogin aksiyonu ile post metodundan veri göndermişse
app.post('/doLogin', function(request, response) {
  //Eğer zaten giriş yapılmışsa yönlendir
  if (request.session.loggedin) {
    response.redirect('/home');
    response.end();
    return;
  }
  //Users tablomuza bağlanmayı deneyelim
  connectTable(tables.users).then((conn) => {
    var username = request.body.username;
    var password = request.body.password;
    //şifre ve kullanıcı adı girildi mi
    if (username && password) {
      const statement = conn.prepareStatement('SELECT * WHERE username = ? AND password = ?');
      //kullanıcı adımızı ve şifremizin md5 ile şifrelenmiş halini içeren bir kayıt var mı
      statement.query(username,md5(password)).then((results)=>{
        //bu şifreye ve kullanıcı adına sahip kullanıcı var mı
        if (results.length > 0) {
          request.session.loggedin = true;
          request.session.username = username;
          request.session.data = results[0];
          response.redirect('/home');
        } else {
          response.render('login/login',{err:'Kullanıcı adı veya şifre yanlış.'});
        }
        conn.close();
        response.end();
      });//QUERY
      
    } else {
      conn.close();
      response.render('login/login',{err:'Lütfen geçerli bir kullanıcı adı ve şifre giriniz.'});
      response.end();
    }
  });//CONNECT TABLE

});//APP POST DOLOGIN

//Eğer projects.ejs deki form doLogout aksiyonu ile post metodundan veri göndermişse
app.post('/doLogout', function(request, response) {
  //Eğer giriş yapımamışsa yönlendir
  if (!request.session.loggedin) {
    response.redirect('/');
    response.end();
    return;
  }else{//oturum verilerini default null hallerine getirerek çıkışımızı yapalım
    request.session.loggedin = false;
    request.session.username = null;
    request.session.data = null;
    response.redirect('/');
    response.end();
  }
});//APP POST DOLOGOUT

//kayit sayfası için bir yönlendirme ayarlayalım
app.get('/register', function(request, response) {
  if (request.session.loggedin) {
    response.redirect('/home');
    response.end();
    return; 
  }else{
    response.render('register/register');
  }
});

//Eğer register.ejs daki form doRegister aksiyonu ile post metodundan veri göndermişse
app.post('/doRegister', function(request, response) {
  //Eğer zaten giriş yapılmışsa yönlendir
  if (request.session.loggedin) {
    response.redirect('/home');
    response.end();
    return;
  }
  //Users tablomuza bağlanmayı deneyelim
  connectTable(tables.users).then((conn) => {
    var username = request.body.username;
    var password = request.body.password;
    var confirm = request.body.confirm;
    //şifre, şifre tekrarı ve kullanıcı adı girildi mi
    if (username && password && confirm && (password == confirm)) {
      var statement = conn.prepareStatement('SELECT * WHERE username = ?');

      statement.query(username).then((results)=>{
        //bu kullanıcı adında kayıtlı başka bir kullanıcı var mı
        if (results.length == 0) {
            //kullanıcı adımızı ve md5 ile hashlenmiş şifremizi json veri akışına insert edelim
            const statm = conn.prepareStatement('INSERT VALUES {"username": "'+ username +'", "password": "'+ md5(password) + '"}');
            statm.query().then((results)=>{
                //yeni insertimizi içeren düzenlenmiş json veri akışını dosyaya yazalım
                saveTable(conn,results);
                conn.close();
                response.redirect('/');
            }).catch((err)=>{
              console.log(err);
            });//INSERT QUERY
        } else {
          response.render('register/register',{err:'Bu kullanıcı adı zaten alınmış.'});
        }
        conn.close();
        response.end();
      });//USERNAME CHECK QUERY
    } else {
      conn.close();
      if(password && username){//Eğer kullanıcı adı ve şifre varsa şifre tekrarı eşleşmiyor demektir
        response.render('register/register',{err:'Şifre tekrarı ile şifre eşleşmiyor.'});
      }else{
        response.render('register/register',{err:'Lütfen geçerli bir kullanıcı adı ve şifre giriniz.'});
      }
      response.end();
    }
  });//CONNECT TABLE

});//APP POST DOREGISTER

//Giriş/Kayıt başarılı ise gösterilecek anasayfa
app.get('/home', function(request, response) {
	if (request.session.loggedin) {
      //Projects tablomuza bağlanmayı deneyelim
      connectTable(tables.projects).then((conn) => {
          const statement = conn.prepareStatement('SELECT * WHERE owner = ?');
          //kullanıcı id mizin owner(sahip) olarak kayıtlı olduğu bir proje var mı
          statement.query(request.session.data.id).then((results)=>{
            if (results.length > 0) {
              response.render('project/projects', { user: request.session.data, projects: results });
            } else {
              response.render('project/projects', { user: request.session.data, projects:[] });
            }
            conn.close();
            response.end();
          });//QUERY
      });//CONNECT TABLE
	} else {
    response.redirect('/');
    response.end();
	}
});

//Eğer project.ejs deki form addProject aksiyonu ile post metodundan veri göndermişse
app.post('/addProject', function(request, response) {
  //Eğer giriş yapılmamışsa yönlendir
  if (!request.session.loggedin) {
    response.redirect('/');
    response.end();
    return;
  }
  //Projects tablomuza bağlanmayı deneyelim
  connectTable(tables.projects).then((conn) => {
    var name = request.body.name;
    var desc = request.body.desc;
    //proje adı ve açıklaması girildi mi
    if (name && desc) {
      //proje adımızı ve açıklamamızı proje sahibi olan aktif oturum idsi ile json veri akışına insert edelim
      const statm = conn.prepareStatement('INSERT VALUES {"name": "'+ name +'", "desc": "'+ desc + '", "owner":'+ request.session.data.id +'}');
      statm.query().then((results)=>{
        console.log(results);
        //yeni insertimizi içeren düzenlenmiş json veri akışını dosyaya yazalım
        saveTable(conn,results);
        conn.close();
        response.redirect('/home');
      }).catch((err)=>{
        console.log(err);
      });//INSERT QUERY
    } else {
      //Projeler sayfamızı hatayla beraber göstereceğiz
      //Projects tablomuza bağlanmayı deneyelim
      connectTable(tables.projects).then((conn) => {
        const statement = conn.prepareStatement('SELECT * WHERE owner = ?');
        //kullanıcı id mizin owner(sahip) olarak kayıtlı olduğu bir proje var mı
        statement.query(request.session.data.id).then((results)=>{
          if (results.length > 0) {
            response.render('project/projects', { user: request.session.data, projects: results, err:'Lütfen bir proje adı ve açıklaması giriniz.'});
          } else {
            response.render('project/projects', { user: request.session.data, projects:[], err: 'Lütfen bir proje adı ve açıklaması giriniz.'});
          }
          conn.close();
          response.end();
        });//QUERY
      });//CONNECT TABLE
    }
  });//CONNECT TABLE

});//APP POST ADD PROJECT

//Eğer project-panel.ejs deki form editProject aksiyonu ile post metodundan veri göndermişse
app.post('/project/editProject', function(request, response) {
  //Eğer giriş yapılmamışsa yönlendir
  if (!request.session.loggedin) {
    response.redirect('/');
    response.end();
    return;
  }
  //Projects tablomuza bağlanmayı deneyelim
  connectTable(tables.projects).then((conn) => {
    var id = request.body.id;
    var owner = request.body.owner;
    var name = request.body.name;
    var desc = request.body.desc;

    //Eğer proje bize ait değilse anasayfaya atalım
    if(owner != request.session.data.id){
      response.redirect('/');
      response.end();
      return;
    }

    //proje adı ve açıklaması gizli inputlarla beraber girildi mi
    if (id && owner && name && desc) {
      //proje adımızı ve proje açıklamamızı proje idsi ile json veri akışında güncelleyelim
      const statm = conn.prepareStatement('UPDATE SET name = ?, desc = ? WHERE id = ?');
      statm.query(name,desc,id).then((results)=>{
        console.log(results);
        //yeni updateimizi içeren düzenlenmiş json veri akışını dosyaya yazalım
        saveTable(conn,results);
        conn.close();
        response.redirect('/project/' + id);
      }).catch((err)=>{
        console.log(err);
      });//UPDATE QUERY
    }
  });//CONNECT TABLE

});//APP POST EDIT PROJECT

//Eğer project-panel.ejs deki form deleteProject aksiyonu ile post metodundan veri göndermişse
app.post(['/project/:prId/deleteProject','/project/deleteProject'], function(request, response) {
  //Eğer giriş yapılmamışsa yönlendir
  if (!request.session.loggedin) {
    response.redirect('/');
    response.end();
    return;
  }
  //Projects tablomuza bağlanmayı deneyelim
  connectTable(tables.projects).then((conn) => {
    var id = request.body.id;
    var owner = request.body.owner;
    var password = request.body.password;

    //Eğer proje bize ait değilse anasayfaya atalım
    if(owner != request.session.data.id){
      response.redirect('/');
      response.end();
      return;
    }

    //Eğer hesap şifresi hatalıysa hata mesajı verelim
    if(md5(password) != request.session.data.password){
      response.redirect('/project/'+id+"/?delErr=Yanlış şifre.");
      response.end();
      return;
    }

    //proje idsi ve sahibinin idsi gizli inputlarla beraber girildiyse
    if (id && owner) {
      //projeyi idsi ile json veri akışından silelim
      const statm = conn.prepareStatement('DELETE WHERE id = ?');
      statm.query(id).then((results)=>{
        console.log(results);
        //yeni delete değişimini içeren düzenlenmiş json veri akışını dosyaya yazalım
        saveTable(conn,results);
        conn.close();

        //projeye ait taskleri de silelim
        connectTable(tables.tasks).then((connect) => {
          connect.prepareStatement('DELETE WHERE projectId = ?').query(id).then((result) => {
              //yeni delete değişimini içeren düzenlenmiş json veri akışını dosyaya yazalım
              saveTable(connect,result);
              connect.close();
              //silme işlemleri bitti ana sayfaya yönlendirelim
              response.redirect('/');
          })
        });

        response.redirect('/');
      }).catch((err)=>{
        console.log(err);
      });//INSERT QUERY
    }
  });//CONNECT TABLE

});//APP POST DELETE PROJECT

//Taskler hareket ederken AJAX ile arka planda bu uçnoktaya ulaşarak kaydedilir
app.get('/project/move/:taskId/:targetId', function (request, response) {
  //Eğer giriş yapılmamışsa yönlendir
  if (!request.session.loggedin) {
    response.redirect('/');
    response.end();
    return;
  }

  connectTable(tables.tasks).then((connect) => {
    connect.prepareStatement('UPDATE SET position = ? WHERE id = ? AND owner = ?').query(request.params.targetId,request.params.taskId,request.session.data.id).then((result) => {
      //yeni updateimizi içeren düzenlenmiş json veri akışını dosyaya yazalım
      saveTable(connect,result);
      connect.close();
      response.send('OK');
    }).catch((err)=>{
      console.log(err);
    });//UPDATE QUERY
  });//CONNECT TABLE
});//APP MOVE TASK

//Projemizi ve projemize ait taskleri task boardımızda görüntüleyelim
app.get('/project/:prId', function (request, response) {
  //Eğer giriş yapılmamışsa yönlendir
  if (!request.session.loggedin) {
    response.redirect('/');
    response.end();
    return;
  }

  var prId = request.params.prId;

  connectTable(tables.projects).then((conn) => {
    const statement = conn.prepareStatement('SELECT * WHERE owner = ? AND id = ?');
    //kullanıcı id mizin owner(sahip) olarak kayıtlı olduğu prId de bir proje var mı
    statement.query(request.session.data.id, prId).then((results)=>{
      if (results.length > 0) {
        conn.close();
        connectTable(tables.tasks).then((conn) => {
          conn.prepareStatement('SELECT * WHERE owner = ? AND projectId = ?').query(request.session.data.id, prId).then((result) => {
            response.render('project/project-panel', {tasks:result,user: request.session.data, project: results[0], delErr: request.query.delErr });
          });//QUERY
        });//CONNECT TABLE
      } else {//projenin sahibi değilsek ya da o idde proje yoksa anasayfaya yönlendir
        response.redirect('/');
        conn.close();
      }
    });//QUERY
  });//CONNECT TABLE
});//APP SHOW PROJECT

//Bazı durumlarda /edit eklenmeden çağırılırsa yönlendirelim
app.get('/task/:taskId', function (request, response) {
  response.redirect('/task/'+request.params.taskId+'/edit');
  response.end();
  return;
});

//İş verilerini görüntüleyelim ve düzenleyebilelim
app.get('/task/:taskId/:projectId', function (request, response) {
  //Eğer giriş yapılmamışsa yönlendir
  if (!request.session.loggedin) {
    response.redirect('/');
    response.end();
    return;
  }

  //
  var taskId = request.params.taskId;
  if(taskId == "add"){
    response.render('tasks/task', {task:{
      "title":"",
      "text":"",
      "owner": request.session.data.id,
      "position":"0",
      "hardness":"1",
      "projectId":request.params.projectId,
      "notes":"",
      "records":""
    },user: request.session.data });
    response.end();
    return;
  }

  connectTable(tables.tasks).then((conn) => {
    const statement = conn.prepareStatement('SELECT * WHERE owner = ? AND id = ?');
    //kullanıcı id mizin owner(sahip) olarak kayıtlı olduğu taskId de bir task var mı
    statement.query(request.session.data.id, taskId).then((results)=>{
      if (results.length > 0) {
        response.render('tasks/task', {task:results[0],user: request.session.data, delErr: request.query.delErr });
        conn.close();
      } else {//taskın sahibi değilsek ya da o idde task yoksa anasayfaya yönlendir
        response.redirect('/');
        conn.close();
      }
    });//QUERY
  });//CONNECT TABLE
});//APP SHOW TASK

//Eğer task.ejs deki form editTask aksiyonu ile post metodundan veri göndermişse
app.post('/task/editTask', function(request, response) {
  //Eğer giriş yapılmamışsa yönlendir
  if (!request.session.loggedin) {
    response.redirect('/');
    response.end();
    return;
  }
  //Tasks tablomuza bağlanmayı deneyelim
  connectTable(tables.tasks).then((conn) => {
    var id = request.body.id;
    var owner = request.body.owner;
    var title = request.body.title;
    var text = request.body.text;
    var notes = request.body.notes;
    var hardness = request.body.hardness;    
    var records = request.body.records;
    var projectId = request.body.projectId;

    //Eğer iş bize ait değilse anasayfaya atalım
    if(owner != request.session.data.id){
      response.redirect('/');
      response.end();
      return;
    }

    if(!id || id.length == 0){
      id=-1;
    }

    //iş adı ve iş açıklaması gizli inputlarla beraber girildi mi
    if (id && owner && title && text && hardness) {
      //iş adımızı ve iş açıklamamızı iş idsi ile json veri akışında güncelleyelim
      var statm;
      var process;
      if(id != -1){//Düzenle
        process = "edit";
        statm = conn.prepareStatement('UPDATE SET title = ?, text = ?, notes = ?, hardness = ?, records = ?, projectId = ? WHERE id = ?');
      }else{//Ekle
        id=owner;
        process = "add";
        statm = conn.prepareStatement('INSERT VALUES {position:0, "title": ?, "text": ?, "notes": ?, "hardness": ?, "records": ?, projectId: ?, "owner": ?}');
      }

      statm.query(title,text,notes,hardness,records,projectId,id).then((results)=>{
        console.log(results);
        //yeni updateimizi içeren düzenlenmiş json veri akışını dosyaya yazalım
        saveTable(conn,results);
        conn.close();
        if(process == "edit"){
          response.redirect('/task/' + id) + "/edit";
        }else{
          response.redirect('/project/' + projectId);
        }
      }).catch((err)=>{
        console.log(err);
      });//UPDATE QUERY
    }
  });//CONNECT TABLE

});//APP POST EDIT TASK

app.listen(3000);