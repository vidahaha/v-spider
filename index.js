const superagent = require('superagent')
require('superagent-charset')(superagent)
const cheerio = require('cheerio')
const fs = require('fs')

// 设置种子URL
const seedUrl = "http://www.dapenti.com/blog/index.asp"
const seedUrlPrefix = "http://www.dapenti.com/blog/"

// 请求该网页，进而抓取网页中所有新闻的链接页面
superagent.get( seedUrl ).charset('gbk').end( ( err, res ) => {

    if ( err ) {
        throw new Error(err)
    }

    let $ = cheerio.load( res.text )
    let urlList = []
    let articleHref = $("a")
    let allData = []

    articleHref.each( ( i, ele ) => {

        let curHref = $(ele).attr('href')
        let curTitle = $(ele).attr('title')

        if ( curHref && curTitle ) {
            urlList.push( seedUrlPrefix + curHref )
        }

    })
    
    // 所有的链接搞定后再写入文件
    Promise.all( urlList.map( u => {  

        return new Promise( resolve => { 

            superagent.get( u ).charset('gbk').end( ( err, res ) => {

                $ = cheerio.load( res.text )
    
                let title = $('.style1').text()
                let time = $(".oblog_text").first().text()
                let content = $(".oblog_text").last().text().replace(/\s/g, '')
                let editor = ''
    
                let regTime = /^(.+) (.+) (.+ .+)$/g.exec( time )

                if ( regTime ) {
                    editor = regTime[1]
                    time = regTime[3]
                }

                allData.push({
                    title,
                    time,
                    editor,
                    content
                })

                resolve()
            })

        })

    }))
    .then( () => {
        writeJson( JSON.stringify( allData ) )
    })

})  

const writeJson = data => {
    fs.writeFileSync( __dirname + '/data.json', data)
}