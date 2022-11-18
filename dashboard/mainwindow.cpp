#include "mainwindow.h"
#include "ui_mainwindow.h"
#include <QWebEngineProfile>

MainWindow::MainWindow(QWidget *parent)
    : QMainWindow(parent)
    , ui(new Ui::MainWindow)
{
    QWebEngineProfile::defaultProfile()->setHttpAcceptLanguage("en-US,en;q=0.8");
    ui->setupUi(this);
    QUrl myURL = QUrl("https://my.weather.gov.hk/personalized-website/english/");
    //ui->webEngineBottom->page()->profile()->setHttpAcceptLanguage("en-US,en;q=0.5");
    ui->webEngineBottom->setUrl(myURL);
    ui->webEngineBottom->page()->runJavaScript("document.body.style.overflow='hidden';");
    this->setWindowFlags(Qt::Window | Qt::FramelessWindowHint);
}

MainWindow::~MainWindow()
{
    delete ui;
}

