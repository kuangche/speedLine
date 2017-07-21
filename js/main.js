var bw, bh;
if(window.innerWidth){
    bw = window.innerWidth;
} else if(document.body && document.body.clientWidth){
    bw = document.body.clientWidth;
}
if(window.innerHeight){
    bh = window.innerHeight;
} else if(document.body && document.body.clientHeight){
    bh = document.body.clientHeight;
}
if(document.documentElement && document.documentElement.clientHeight && document.documentElement.clientWidth){
    bh = document.documentElement.clientHeight;
    bw = document.documentElement.clientWidth;
}

var w = bw;
var h = bh;
var size = 5;
var data = [];
for(i = 0; i<size; i++){
	data.push([ parseInt(Math.random()*w), parseInt(Math.random()*h), parseInt(Math.random()*10)])
}
$('#mapBox').height(h);


data = [[116.547962,39.947523,5],[116.550764,39.915322,2],[116.607106,39.914935,8],[116.608543,39.904862,7]]

var map = new BMap.Map("mapBox");    // 创建Map实例
map.centerAndZoom(new BMap.Point(116.607106,39.914935), 14);  // 初始化地图,设置中心点坐标和地图级别
map.addControl(new BMap.MapTypeControl());   //添加地图类型控件
map.enableScrollWheelZoom(true);     //开启鼠标滚轮缩放
map.setMapStyle({
	styleJson:styleJson
});

var baseCanvas = new MapMask({
    map: map,
    elementTag: "canvas"
});
baseCanvas.show();
var context = baseCanvas.getContainer().getContext("2d");

setTimeout(function(){
	var speedLine = new SpeedLine({
		context: context,
		map:map,
		data:data,
		p2pLong:10,
		height:h,
		width:w,
		style:{
			lineWidth:5
		}
	})
},1000)