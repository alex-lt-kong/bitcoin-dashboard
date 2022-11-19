#include "mainwindow.h"
#include "ui_mainwindow.h"
#include <QWebEngineProfile>

MainWindow::MainWindow(QWidget *parent)
    : QMainWindow(parent)
    , ui(new Ui::MainWindow)
{
    QWebEngineProfile::defaultProfile()->setHttpAcceptLanguage("en-US,en;q=0.5");
    QWebEngineProfile::defaultProfile()->setHttpUserAgent("Mozilla/5.0 (X11; Linux x86_64; rv:91.0) Gecko/20100101 Firefox/91.0");
    ui->setupUi(this);
    //QUrl myURL = QUrl("http://testbed.hk.lan:81/");
    QUrl myURL = QUrl("https://www.hko.gov.hk/en/index.html");
    //ui->webEngineBottom->page()->profile()->setHttpAcceptLanguage("en-US,en;q=0.5");
    ui->webEngineBottom->setUrl(myURL);
    //this->setWindowFlags(Qt::Window | Qt::FramelessWindowHint);
}

MainWindow::~MainWindow()
{
    delete ui;
}

