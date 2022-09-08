// 立即执行函数  封闭作用域 私有化参数
try {
  (function () {
    var pageData = {
      isScroll: false, // 滚动状态
      scrollTime: 30, //  滚动时长
      lineH: 70,
      speed: 1,
      timer: null,
      countDownEl: document.getElementById("countDown"),
      scrollViewEl: document.getElementById("scrollCtn"),
      scrollEl: document.getElementById("scroll"),
      btnEl: document.getElementById('btn'),
      token: (window.location.search.split("token=")[1] || "").split("&")[0]
    }
    if (!pageData.token) {
      showPopup({ msg: "无效访问", closeWindow: true })
      return
    }
    init()
    function init() {
      try {
        requestHttp("/gamesFraction/getGamesFractionCount", {
          data: { token: pageData.token },
          success: function (res) {
            var data = []
            var innerHtml = ''
            for (var index = 0; index < res.data.length; index++) {
              var element = res.data[index] || {};
              var obj = {
                sort: index + 1,
                id: element.id,
                name: element.nickname,
                date: new Date(element.uploadTime).toLocaleString().replace(/\//g, '-')
              }
              innerHtml += "<div class='line'><div class='sort'>" + obj.sort + "</div><div class='name'>" + obj.name + "</div><div class='time'>" + obj.date + "</div></div>"
              data.push(obj)
            }
            pageData.data = data
            pageData.scrollEl.innerHTML = innerHtml
            pageData.lineH = $(".line").outerHeight()
            pageData.btnEl.addEventListener("click", beginOrStop)
            $(".countDown")[0].innerText = pageData.scrollTime
            getPrizeUser()
          },
          error: function (err) {
            showPopup({ title: '提示', msg: err.msg || err.message || "系统错误" })
          }
        })
      } catch (error) {
        alert(error)
      }
    }
    //  点击开始及结束
    function beginOrStop(flag) {
      try {
        if (pageData.isScroll || flag === true) {
          pageData.isScroll = false
          pageData.btnEl.className = "begin"
        } else {
          if (pageData.speed <= 0) {
            getPrizeUser()
            return
          }
          pageData.countDown = pageData.scrollTime
          pageData.btnEl.className = "stop"
          pageData.isScroll = true
          scrollView()
          changSpeed()
          pageData.beginTime = new Date().getTime()
          countDown()
        }
      } catch (error) {
        alert(error)
      }
    }
    function countDown() {
      try {
        requestAnimationFrame(() => {
          if (pageData.speed <= 0) return
          if (pageData.beginTime) {
            var time = pageData.scrollTime - Math.ceil((new Date().getTime() - pageData.beginTime) / 1000)
            time = time > 0 ? time : 0
            if (pageData.countDownEl.innerText != time) {
              pageData.countDownEl.innerText = time > 0 ? time : 0
            }
            if (time === 0) {
              beginOrStop(true)
            } else {
              countDown()
            }
          } else {
            pageData.countDownEl.innerText = pageData.scrollTime
          }
        })
      } catch (error) {
        alert(error)
      }
    }
    // 改变速度
    function changSpeed() {
      try {
        var speed = pageData.speed
        if (speed === 0) return
        setTimeout(() => {
          speed += (pageData.isScroll ? 1 : -1)
          pageData.speed = speed >= 0 ? speed <= pageData.lineH ? speed : pageData.lineH : 0
          changSpeed()
        }, 100)
      } catch (error) {
        alert(error)
      }
    }
    // 滚动
    function scrollView() {
      try {
        window.requestAnimationFrame(() => {
          var top = parseInt(pageData.scrollEl.style.top) || 0
          if (top <= -pageData.lineH) {
            const firstLine = $('.line')[0]
            firstLine.parentNode.removeChild(firstLine)
            pageData.scrollEl.appendChild(firstLine)
            top += pageData.lineH
            const firstItem = pageData.data.shift()
            pageData.data.push(firstItem)
          }
          top -= pageData.speed
          pageData.scrollEl.style.top = top + "px"
          getPrizeUser()
          if (pageData.speed !== 0) {
            scrollView()
          }
        })
      } catch (error) {
        alert(error)
      }
    }
    // 获取获奖用户
    function getPrizeUser() {
      try {
        const windowH = pageData.scrollViewEl.offsetHeight
        const scrollT = parseInt(pageData.scrollEl.style.top) || 0
        const index = Math.ceil((Math.ceil(windowH / 2) - scrollT) / pageData.lineH)
        const prizeUser = pageData.data[index - 1]
        $(".prizeLine")[0] && $(".prizeLine")[0].classList.remove("prizeLine")
        $(".line")[index - 1].classList.add("prizeLine")
        if (pageData.speed === 0) {
          requestHttp('/gamesFraction/addRotationText', {
            method: "POST",
            data: {
              id: prizeUser.id || '',
              name: prizeUser.name || '',
              text: `${prizeUser.name}中奖`
            },
            success: function () {
              showPopup({ msg: "恭喜序号“" + prizeUser.sort + "”的用户“" + prizeUser.name + "”获奖" })
            },
            error: function (err) {
              showPopup({ title: '提示', msg: err.msg || err.message || "系统错误" })
            }
          })
        }
      } catch (error) {
        alert(error)
      }
    }
    var fun = null
    function showPopup(arg) {
      try {
        document.querySelector(".popup").style.display = "block"
        // document.querySelector(".popup").addEventListener("click", (e) => { e.stopPropagation() })
        document.querySelector(".popup .msg").innerText = arg.msg || "系统错误"
        fun = closePopup(arg.closeWindow)
        document.querySelector(".popup .confirmBtn").addEventListener("click", fun)
      } catch (error) {
        alert(error)
      }
    }
    function closePopup(flag = false) {
      return function () {
        try {
          document.querySelector(".popup").style.display = "none"
          document.querySelector(".popup .confirmBtn").removeEventListener("click", fun)
          if (flag) {
            closeWindow()
          }
        } catch (error) {
          alert(error)
        }
      }
    }
    function closeWindow() {
      try {
        window.opener = null
        window.open('', '_self')
        window.close()
      } catch (error) {
        alert(error)
      }
    }
    function requestHttp(url, options) {
      try {
        var successFun = options.success
        delete options.success
        options.success = function (res) {
          if (res.code !== 200) {
            options.error(res)
          } else {
            successFun(res)
          }
        }
        options.timeout = 10000
        options.headers = { 'Content-Type': "application/json;charset=utf8" }
        if (options.method === 'POST') {
          options.data = JSON.stringify(options.data)
        }
        $.ajax("https://ab.lovedarts.cn/ab" + url, options)
      } catch (error) {
        alert(error)
      }
    }
  })()
} catch (error) {
  alert(error)
}