var localUrlReg = /(https?:\/\/)(localhost|127\.0\.0\.1)/i;
var toArray = Array.prototype.slice.call

var $qrSize = document.getElementById('qrSize')
var $qrImage = document.getElementById("qrImage")
var $colorDark = document.getElementById("colorDark")
var $colorLight = document.getElementById("colorLight")
var $minImgSrc = document.getElementById("minImgSrc")
var $minImgSize = document.getElementById("minImgSize")
var $qrTxt = document.getElementById("qrTxt")
var $container = document.querySelector('.container');
var $ipList = document.querySelector('.col-des .is-list')
var $historyList = document.getElementById('historyList')
var $downQrImg = document.getElementById('downQrImg')

var originalUrl // 原始URL内容
chrome.tabs.query({active:true}, function(tabs){
	// 基本变量声明
	var url = originalUrl = tabs[0].url; // 当前页面url

	// 判断当前是否是localhost, 如果是则需要替换ip地址
	if ( localUrlReg.test(url) ){
		getLocalIPs(function(ips){
			url = replaceLocalDomain(url, ips[0])
			updateIpsList(ips);
			updatePanel(url);
		});
	} else {
		updatePanel(url);
	}
});

function updatePanel(url){
	$qrTxt.value = url;

	var qrSizeVal = storage('qrSize')
	if(qrSizeVal) $qrSize.value = qrSizeVal;

	var minImgSrcVal = storage('minImgSrc')
	if(minImgSrcVal) $minImgSrc.value = minImgSrcVal;

	var minImgSizeVal = storage('minImgSize')
	if(minImgSizeVal) $minImgSize.value = minImgSizeVal;

	var colorDarkVal = storage('colorDark')
	if(colorDarkVal) $colorDark.value = colorDarkVal;
	$colorDark._picker = new jscolor($colorDark)

	var colorLightVal = storage('colorLight')
	if(colorLightVal) $colorLight.value = colorLightVal;
	$colorLight._picker = new jscolor($colorLight)

	createQrImg(url);
	updateHistoryList(url);
}

// 历史记录
function updateHistoryList(url){
	// 获取历史列表
	var _history = storage('_history')
	// 判断是否有值
	_history = _history ? _history.split(',') : []
	var len = _history.length

	if(url && _history.indexOf(url) == -1){
		_history.push(url)
		storage('_history', _history.join(','));
	}

	if(!len) return;

	var html = _history.map(function(url){
					return `<li><a title="点击生成" class="create" href="${url}">${url}</a><a url="${url}" class="del" href="#">删除</a></li>`;
				})
				.reverse() // 由新到旧显示
				.join('');

	$historyList.innerHTML = `<p class="his-btn"><a class="historyBtn" href="#">清空历史记录</a></p><ul>${html}</ul>`;
	toArray( $historyList.querySelectorAll('a') ).forEach(function(aBtn){
		aBtn.addEventListener('click', function(e){
			e.preventDefault();
			if(this.className == 'historyBtn'){ // 清空
				storage('_history', '');
				$historyList.innerHTML = ''
			}else if(this.className == 'del'){ // 删除
				var index = _history.indexOf(this.url)
				_history.splice(index, 1)
				this.parentElement.remove()
				storage('_history', _history.join(','));
			}else if(this.className == 'create'){ // 生成
				updatePanel( this.href.toString().trim() )
			}
		}, false)
	});
}

// 根据本机IP地址替换URL域名
function updateIpsList(ips){
	var html = ips.map(function(ip){
		return `<li>${ip}<a href="#" class="create" id="${ip}">生成</a></li>`;
	}).join('');
	$ipList.innerHTML = `<h4>对外IP列表：</h4><ul>${html}</ul>`;

	toArray( $ipList.querySelectorAll('ul a') ).forEach(function(aBtn){
		aBtn.addEventListener('click', function(e){
			e.preventDefault();
			var url = $qrTxt.value
			var ip = e.target.id
			url = replaceLocalDomain(originalUrl, ip)
			updatePanel(url);
		}, false)
	})
}

// 下载二维码图
$downQrImg.addEventListener('click', function(e){
	// 加入线上中图后存在跨域问题，toDataURL方法报错
	// TODO 尝试使用本地图片绕过限制
	try{
		var dt = $qrImage.querySelector('canvas').toDataURL('image/png');
	}catch(e){
		$downQrImg.style.backgroundColor = 'rgba(255,0,0,.5)'
		$downQrImg.innerHTML = '无法下载，请自行截图保存'
	}
	var fileName = 'qrcode.png'

	/* Change MIME type to trick the browser to downlaod the file instead of displaying it */
	dt = dt.replace(/^data:image\/[^;]*/, 'data:application/octet-stream');

	/* In addition to <a>'s "download" attribute, you can define HTTP-style headers */
	dt = dt.replace(/^data:application\/octet-stream/, 'data:application/octet-stream;headers=Content-Disposition%3A%20attachment%3B%20filename='+ fileName);

	this.href = dt
	this.download = fileName;
}, false)

// Input 修改
toArray( document.querySelectorAll('.col-des input') ).forEach(function(item){

	/* if(item.id == 'colorDark' || item.id == 'colorLight'){
		item._picker = new jscolor(item)
	} */

	item.onfocus = function(){
		if(this.id == 'colorDark' || this.id == 'colorLight'){
			this._picker.show()
		}
	}

	item.onblur = _cb
	item.onkeydown = function(e){
		if(e.keyCode == 13) // 回车
			_cb.call(this)
	}

	function _cb(){
		var val = this.value.toString().trim()
		var key = this.id

		if(val && this.id == 'qrTxt'){ // URL发生变化时放入历史记录中
			updateHistoryList(val)
		}else if(key){
			storage(key, val);
		}
		createQrImg();
	}
});

// 本地数据操作
function storage(key, val){
	if(!key) return;
	if(arguments.length == 1){
		return window.localStorage[key];
	}else{
		window.localStorage[key] = val
	}
}

// 更新QrCode区域
function createQrImg(txt){
	var obj = {
		text: txt || $qrTxt.value,
		render: 'canvas',
		size: $qrSize.value || 200,
		correctLevel : 3,
		background: '#'+ $colorLight.value,
		foreground: '#'+ $colorDark.value,
		image : $minImgSrc.value,
		imageSize: $minImgSize.value || 30
	}

	$qrImage.innerHTML = '';
	qrNode = new QRCode(obj);
	$qrImage.appendChild(qrNode);
}

// 替换URL中的本地域名
function replaceLocalDomain(text, remoteUrl){
	return text.replace(localUrlReg, '$1'+ remoteUrl);
}

// 获取本地的IP地址列表
function getLocalIPs(callback) {
    var ips = [];

    var RTCPeerConnection = window.RTCPeerConnection
							|| window.webkitRTCPeerConnection
							|| window.mozRTCPeerConnection

    var pc = new RTCPeerConnection({
        // Don't specify any stun/turn servers, otherwise you will
        // also find your public IP addresses.
        iceServers: []
    });
    // Add a media line, this is needed to activate candidate gathering.
    pc.createDataChannel('');

    // onicecandidate is triggered whenever a candidate has been found.
    pc.onicecandidate = function(e) {
        if (!e.candidate) {
            // Candidate gathering completed.
            callback(ips);
            return;
        }
        var ip = /^candidate:.+ (\S+) \d+ typ/.exec(e.candidate.candidate)[1];
        if (ips.indexOf(ip) == -1) // avoid duplicate entries (tcp/udp)
            ips.push(ip);
    };
    pc.createOffer(function(sdp) {
        pc.setLocalDescription(sdp);
    }, function onerror() {});
}
