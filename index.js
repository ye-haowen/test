(() => {
  try {
    var pageData = {
      isScroll: false,
      scrollTime: 30,
      scrollViewEl: document.querySelector(".scrollCtn"),
      scrollEl: document.getElementById("scroll"),
      btnEl: document.getElementById('btn'),
      lineH: 70,
      speed: 1,
      timer: null,
      countDownEl: document.querySelector(".countDown"),
      token: (window.location.search.split("token=")[1] || "").split("&")[0]
    }
    if (!pageData.token) {
      showPopup({ msg: "无效访问", closeWindow: true })
      return
    }
    Fetch("/gamesFraction/getGamesFractionCount", {
      data: { token: pageData.token }
    }).then(res => {
      if (res.code !== 200) {
        throw "服务器错误"
      }
      pageData.data = res.data.map((itemM, indexM) => {
        itemM = itemM || {}
        return {
          sort: indexM + 1,
          id: itemM.id,
          name: itemM.nickname,
          date: new Date(itemM.uploadTime).toLocaleString().replace(/\//g, '-')
        }
      })
      init()
    }).catch(err => {
      showPopup({ title: '提示', msg: err.msg || err.message || "系统错误" })
    })
    function init() {
      var innerHtml = ''
      pageData.data.forEach(item => {
        innerHtml += "<div class='line'><div class='sort'>" + item.sort + "</div><div class='name'>" + item.name + "</div><div class='time'>" + item.date + "</div></div>"
      })
      pageData.scrollEl.innerHTML = innerHtml
      pageData.lineH = document.querySelector(".line").offsetHeight
      pageData.btnEl.addEventListener("click", beginOrStop)
      document.querySelector('.countDown').innerText = pageData.scrollTime
      getPrizeUser()
    }
    //  点击开始及结束
    function beginOrStop(flag) {
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
    }
    function countDown() {
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
    }
    // 改变速度
    function changSpeed() {
      var speed = pageData.speed
      if (speed === 0) return
      setTimeout(() => {
        speed += (pageData.isScroll ? 1 : -1)
        pageData.speed = speed >= 0 ? speed <= pageData.lineH ? speed : pageData.lineH : 0
        changSpeed()
      }, 100)
    }
    // 滚动
    function scrollView() {
      window.requestAnimationFrame(() => {
        var top = parseInt(pageData.scrollEl.style.top) || 0
        if (top <= -pageData.lineH) {
          const firstLine = document.querySelector('.line')
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
    }
    // 获取获奖用户
    function getPrizeUser() {
      const windowH = pageData.scrollViewEl.offsetHeight
      const scrollT = parseInt(pageData.scrollEl.style.top) || 0
      const index = Math.ceil((Math.ceil(windowH / 2) - scrollT) / pageData.lineH)
      const prizeUser = pageData.data[index - 1]
      document.querySelector(".prizeLine") && document.querySelector(".prizeLine").classList.remove("prizeLine")
      document.querySelectorAll(".line")[index - 1].classList.add("prizeLine")
      if (pageData.speed === 0) {
        Fetch('/gamesFraction/addRotationText', {
          method: "POST",
          params: {
            id: prizeUser.id || '',
            name: prizeUser.name || '',
            text: `${prizeUser.name}中奖`
          }
        }).then(() => {
          showPopup({ msg: `恭喜序号“${prizeUser.sort}”的用户“${prizeUser.name}”获奖` })
        }).catch((err) => {
          showPopup({ title: '提示', msg: err.msg || err.message || "系统错误" })
        })
      }
    }
    // 请求封装
    function Fetch(url, { method, params, data }, baseUrl = "http://192.168.1.42:8031/ab") {
      url = `${baseUrl}${url}`
      if (data) {
        url += '?'
        Object.entries(data).forEach((itemF, index) => {
          if (index !== 0) {
            url += '&'
          }
          url += `${itemF[0]}=${itemF[1] || ''}`
        })
      }
      return new Promise((resolve, reject) => {
        fetch(url, {
          method: String(method || '').toLocaleUpperCase() || 'GET',
          body: params ? JSON.stringify(params) : null,
          headers: { "Content-Type": "application/json" }
        }).then(res => res.json()).then(res => {
          if (res.code === 200) {
            resolve(res)
          } else {
            reject(res)
          }
        }).catch(err => reject(err))
      })
    }
  } catch (error) {
    showPopup({ msg: error })
  }
  function showPopup(arg) {
    document.querySelector(".popup").style.display = "block"
    document.querySelector(".popup").addEventListener("click", (e) => { e.stopPropagation() })
    document.querySelector(".popup .msg").innerText = arg.msg || "系统错误"
    document.querySelector(".popup .confirmBtn").addEventListener("click", closePopup(arg.closeWindow))
  }
  function closePopup(flag = false) {
    return () => {
      document.querySelector(".popup").style.display = "none"
      flag && closeWindow()
    }
  }
  function closeWindow() {
    window.opener = null
    window.open('', '_self')
    window.close()
  }
})()