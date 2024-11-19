import mysql from "mysql";
var connection = mysql.createConnection({
    host     : 'localhost',
    user     : 'root',
    password : '',
    database : 'task2_dhaval'
  });


import express from "express";
import multer from 'multer';
import nodemailer from 'nodemailer';
import exceljs from "exceljs";
// import pdfkit from "pdfkit";
import pdfkit from "pdfkit";
const PDFDocument = pdfkit;
// var app = express();








const transporter = nodemailer.createTransport({
    service: 'gmail', // For example, Gmail
    auth: {
        user: 'dhavalparmar7727@gmail.com', // Your email address
        pass: 'aoks remz hbhu cmfn'    // Your email password or app-specific password
    }
});

const mailOptions = {
    from: '<dhavalparmar7727@gmail.com>',
    to: 'gulekardikshant@gmail.com,premsai668@gmail.com,jinuparmar10@gmail.com', // Recipient's email address
    subject: 'File Uploaded Successfully',
    text: 'A file has been uploaded successfully.'
};

var uniquepath = Date.now();

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, './uploads')
    },
    filename: function (req, file, cb) {
      cb(null, uniquepath + file.originalname)
    }
  })
  
  const upload = multer({ storage: storage }).single('userfile')

const app = express();

app.use(express.urlencoded());
app.use(express.json());
app.use('/xyz', express.static('uploads'))
app.use("/public", express.static("public"));

app.get('/download-excel', async (req, res) => {
    const workbook = new exceljs.Workbook();
    const worksheet = workbook.addWorksheet('Users');

    worksheet.columns = [
        { header: 'Name', key: 'name', width: 20 },
        { header: 'Dob', key: 'dob', width: 20 },
        { header: 'Place', key: 'place', width: 20 },
        { header: 'About', key: 'about', width: 30 },
        { header: 'User File', key: 'userfile', width: 30 }
    ];

    // Fetch all users from the MySQL database
    connection.query('SELECT * FROM users', function (error, results) {
        if (error) {
            return res.status(500).send('Error fetching users');
        }

        // Add rows to the worksheet
        results.forEach((user) => {
            worksheet.addRow({
                name: user.name,
                dob: user.dob,
                place: user.place,
                about: user.about,
                userfile: user.userfile
            });
        });

        // Set the response headers for Excel file download
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename="users.xlsx"');

        // Write the Excel file to the response
        workbook.xlsx.write(res).then(() => {
            res.end();
        });
    });
});


// Route to download a single row as PDF
app.get('/download-pdf/:id', (req, res) => {
    const userId = req.params.id;
    console.log(`PDF download requested for user ID: ${req.params.id}`);

    // Fetch the user from the database by ID
    connection.query('SELECT * FROM users WHERE id = ?', [userId], function (error, results) {
        if (error || results.length === 0) {
            return res.status(404).send('User not found');
        }

        const user = results[0];
        const doc = new PDFDocument();
        const filename = `${user.name}.pdf`;

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

        // Generate the PDF content
        doc.pipe(res);
        doc.fontSize(25).text(user.name, { align: 'center' });
        doc.moveDown();
        doc.fontSize(16).text(`Date of Birth: ${user.dob}`);
        doc.text(`Place: ${user.place}`);
        doc.text(`About: ${user.about}`);
        doc.end();
    });
});



app.get("/users" , (req,res)=>{
    // res.send("GET ROUTE CALLED")
    connection.query('SELECT * FROM users', function (error, results, fields) {
        if (error){
                 res.status(401).send({msg:error , data:null})
        }
        else{
            res.status(200).send({msg:"success" , data:results})
        }
        
      });
})

app.post("/users" , (req,res)=>{
    // res.send("POST ROUTE CALLED")
    connection.query('INSERT INTO users SET ?', req.body, function (error, results, fields) {
        if (error){
            res.status(401).send({msg:error , data:null})
   }
   else{
       res.status(200).send({msg:"success" , data:results})
   }
});
       
})
app.delete("/users" , (req,res)=>{
    res.send("DELETE ROUTE CALLED")
})
app.put("/users" , (req,res)=>{
    res.send("PUT ROUTE CALLED")
});


app.get("/usershow" , (req,res)=>{
    // res.send("GET ROUTE CALLED")
    connection.query('SELECT * FROM users', function (error, results, fields) {
        if (error){
            console.log(error);
                 res.status(401).send({msg:error , data:null})
        }
        else{
            // res.status(200).send({msg:"success" , data:results})
            console.log(results);
            res.render("showuser.ejs", {data:results});
        }
        
      });
});
app.get("/adduser" , function(req,res){
    res.render("adduserpage.ejs");
});

app.post("/useradd" , (req,res)=>{
    // res.send("POST ROUTE CALLED")
    console.log(req.body);
    connection.query('INSERT INTO users SET ?', req.body, function (error, results, fields) {
        if (error){
            res.status(401).send({msg:error , data:null})
   }
   else{
   
       res.status(200).send({msg:"success" , data:results})
    //    res.redirect("/usershow");
    
    
   }
});
       
})

app.get("/userform", (req,res)=>{
    res.render('userformpage.ejs')
});

app.post("/file-upload-action", (req, res)=>{
    // console.log('test');
    // console.log(req.body);

    upload(req, res, function (err) {
        if (err instanceof multer.MulterError) {
            console.log('Multer Error:', err);
            res.status(500).send('Multer Error');
        } else if (err) {
            console.log('Unknown Error:', err);
            res.status(500).send('Unknown Error');
        } else {
            var record = {
                ...req.body,
                userfile: req.file.filename
            };
            console.log('File Uploaded:', req.file);
            console.log('Request Body:', req.body);

            connection.query('INSERT INTO users SET ?', record, function (error, results) {
                if (error) {
                    res.status(401).send({ msg: error, data: null });
                } else {
                    // Send email notification
                    const mailOptions = {
                        from: '<dhavalparmar7727@gmail.com>',
                        to: 'gulekardikshant@gmail.com,premsai668@gmail.com,jinuparmar10@gmail.com', // Replace with the recipient's email
                        subject: 'File Uploaded Successfully',
                        text: `A file has been uploaded successfully.\n\nFile Details:\nName: ${req.file.originalname}\nPath: /xyz/${req.file.filename}`
                    };

                    transporter.sendMail(mailOptions, (error, info) => {
                        if (error) {
                            console.log('Error sending email:', error);
                        } else {
                            console.log('Email sent:', info.response);
                        }
                    });

                    res.redirect('/usershow');
                }
            });
        }
    });

//   upload(req, res, function (err) {
//     if (err instanceof multer.MulterError) {
//         console.log(err, "Multer Error");

//       // A Multer error occurred when uploading.
//     } else if (err) {
//         console.log(err);
//       // An unknown error occurred when uploading.
//     }

//     var record = {
//         ...req.body,
//         userfile:req.file.filename
//     }
//     console.log(record);

//     console.log(req.file);
//     console.log(req.body);
//     // Everything went fine.

//     // res.send("File Upload Successfully");

//     connection.query('INSERT INTO users SET ?', record, function (error, results, fields) {
//         if (error) {
//             res.status(401).send({msg:error, data:null})
//         }
//         else{
//             // res.status(200).send({msg:"success", data:results})
//             res.redirect('/usershow')
//         }
//       });
//   })
})





app.listen(8000);