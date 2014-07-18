#!/usr/bin/env node

var config = require('./config.json');
var http = require('http');
var fs = require('fs');
var crypto = require('crypto');
var nodemailer = require('nodemailer');
var transporter = nodemailer.createTransport(config.email_notifications_settings.server);


var request = http.get(config.download_url, function (response) {

    var hash = crypto.createHash('sha1');

    var storeObject = {};

    response.on('data', function (data) {
        hash.update(data);
    });

    response.on('end', function () {

        var newStoreObject = {
            time: new Date().toString(),
            url: config.download_url,
            hash: hash.digest('hex')
        }

        fs.exists(config.store_file, function (exists) {
            if (exists) {

                fs.readFile(config.store_file, function (err, data) {
                    
                    if (err) return console.log(err);

                    storeObject = JSON.parse(data);

                    var isUpdated = (storeObject.hash != newStoreObject.hash) ? true : false;

                    if (isUpdated) {
                        config.email_notifications_settings.content.subject += (" - " + config.email_notifications_settings.content.variableContent.updated);
                        config.email_notifications_settings.content.html = "<h1 style='color: #D60024;'>" + config.email_notifications_settings.content.variableContent.updated + "</h1><code>" + JSON.stringify(newStoreObject) + "</code>";
                    } else {
                        config.email_notifications_settings.content.subject += (" - " + config.email_notifications_settings.content.variableContent.fine);
                        config.email_notifications_settings.content.html = "<h1 style='color: #00D627;'>" + config.email_notifications_settings.content.variableContent.fine + "</h1><code>" + JSON.stringify(newStoreObject) + "</code>";
                    }

                    console.log(config.email_notifications_settings.content);

                    transporter.sendMail(config.email_notifications_settings.content, function (error, info) {
                        if (error) {
                            console.log(error);
                        } else {
                            console.log('Message sent: ' + info.response);
                        }
                    });

                    fs.writeFile(config.store_file, JSON.stringify(newStoreObject), function (err) {
                        if (err) return console.log(err);
                    });

                });

            } else {

                fs.writeFile(config.store_file, JSON.stringify(newStoreObject), function (err) {
                    if (err) return console.log(err);
                });

            }
        });

    });
});