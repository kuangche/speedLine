/**
 * 画线和光点，分别在不同的层里面（lineCtx，pointCtx，从主画布复制而来），每次渲染完成后，合并到主画布里面
 * _this.ctx.drawImage(_this.lineCtx.canvas, 0, 0, _this.width, _this.height);
 * _this.ctx.drawImage(_this.pointCtx.canvas, 0, 0, _this.width, _this.height);
 */
function SpeedLine(opts){
	this.ctx = opts && opts.context;
	this.style = opts.style;
	this.data = opts.data;
	this.map = opts.map;
	this.height = opts.height;
	this.width = opts.width;
	this.p2pDist = opts.p2pLong;
	this.data && this.init();//如果map存在，则执行init();
}

SpeedLine.prototype.init = function(){
	var index = 0;
	var _this = this;
	var timeInterval = null;
	
	this.data = this.dataFormat(this.data);
	
	var totalPoint = this.data.length;
	
	var lineCanvas = this.ctx.canvas.cloneNode();
    this.lineCtx = lineCanvas.getContext("2d");
	
	var pointCanvas = this.ctx.canvas.cloneNode();
    this.pointCtx = pointCanvas.getContext("2d");
	
	var timeInterval = setInterval(function(){
		//删除画布上所有元素
		_this.ctx.clearRect(0,0,_this.width,_this.height);
		
		if(index >= (totalPoint -1)){
			//只显示道路元素，不显示运动光标
			_this.ctx.drawImage(_this.lineCtx.canvas, 0, 0, _this.width, _this.height);
			clearInterval(timeInterval);
			return false;
		}else{
			//画线
			_this.lineCtx.beginPath();
	    	_this.lineCtx.moveTo(_this.data[index][0],_this.data[index][1]);
			_this.lineCtx.lineTo(_this.data[index+1][0],_this.data[index+1][1]);
			_this.lineCtx.lineWidth = _this.style.lineWidth;
			_this.lineCtx.lineJoin = "round";
			_this.lineCtx.lineCap = "round";
			var startColor = _this.getColor(_this.linear(_this.data[index][2]));
			var endColor = _this.getColor(_this.linear(_this.data[index+1][2]));
			_this.lineCtx.strokeStyle = _this.getLinearGradient({
				start: _this.data[index],
				end: _this.data[index+1],
				startColor: startColor,
				endColor: endColor
			});
			_this.lineCtx.stroke();
			_this.ctx.drawImage(_this.lineCtx.canvas, 0, 0, _this.width, _this.height);
			
			//移动的光点
			_this.pointCtx.clearRect(0,0,_this.width,_this.height);
			_this.pointCtx.beginPath();
		    _this.pointCtx.strokeStyle = "rgba(255,255,0,0.9)",
		    _this.pointCtx.fillStyle = "rgba(255,255,0,0.9)";
		    _this.pointCtx.shadowColor = '#ff0';
		    _this.pointCtx.shadowOffsetX = 0;
		    _this.pointCtx.shadowOffsetY = 0;
		    _this.pointCtx.shadowBlur = 20;
		    _this.pointCtx.arc(_this.data[index+1][0], _this.data[index+1][1], 3.5, 0, 2 * Math.PI);
		    _this.pointCtx.closePath();
		    _this.pointCtx.fill();
		    _this.ctx.drawImage(_this.pointCtx.canvas, 0, 0, _this.width, _this.height);
		    
			index++;
		}
	},30);
}


/**
 * 获取渐变对象
 * @param start -起点坐标
 * @param end -终点坐标
 * @param startColor -渐变起点颜色
 * @param endColor -渐变终点颜色
 */
SpeedLine.prototype.getLinearGradient = function(opts){
	var start = opts.start;
	var end = opts.end;
	var startColor = opts.startColor;
	var endColor = opts.endColor;
	var grd = this.lineCtx.createLinearGradient(start[0],start[1],end[0],end[1]);  //定义线性渐变对象，设定渐变线起始点和结束点坐标，坐标格式为(起始点x,起始点y,结束点x,结束点y)
	grd.addColorStop(0,startColor);   //定义渐变线起点颜色
	grd.addColorStop(1,endColor);  //定义渐变线结束点的颜色
	return grd;
}


/**
 * 获取颜色插值
 * @param value -当前数值
 */
SpeedLine.prototype.getColor = function(value){
	var start = d3.rgb(255,0,0);    //红色  
	var end = d3.rgb(0,255,0);    //绿色  
	var calculate = d3.interpolate(start,end);
	return calculate(value);
}

/**
 * 比例尺，返回当前值在值域内的大小
 * @param value -当前数值
 */
SpeedLine.prototype.linear = function(value){
	var linear = d3.scale.linear()  
	                .domain([0,10])  
	                .range([0,1]);
	return linear(value);
}


/**
 * 数据转换，坐标系转换平面坐标
 * @param data -[lng,lat,count]
 */
SpeedLine.prototype.dataFormat = function(data){
	var oldData = [];
	var _this = this;
	
	data.forEach(function(m,n){
		var count = m[2];
		var point = _this.getPixel(m);
		oldData.push([point.x,point.y,count])
	});
	
	console.time("test");
	for(var i = 0; i<=oldData.length; i++){
		var next = i+1;
		if(next < oldData.length){
			var toNextLong = _this.p2pLong(oldData[i],oldData[i+1]);
			if(toNextLong > _this.p2pDist){
				var middlePoint = _this.calculatePoint(oldData[i],oldData[i+1]);
				var middleCount = (oldData[i][2]+oldData[i+1][2])/2
				oldData.insert(next,[middlePoint.x,middlePoint.y,middleCount]);
				i--;
			};
		}
	}
	console.timeEnd("test");
	return oldData;
}


/**
 * 计算两点之间的中间点
 */
SpeedLine.prototype.calculatePoint = function(start,end){
	var pointX = (start[0]+end[0])/2;
	var pointY = (start[1]+end[1])/2;
	return {
		x:pointX,
		y:pointY
	};
}

/**
 * 计算相邻两点之间的距离
 */
SpeedLine.prototype.p2pLong = function(point1,point2){
	var lineLong = Math.sqrt((point1[0]-point2[0])*(point1[0]-point2[0]) + (point1[1]-point2[1])*(point1[1]-point2[1]));
	return lineLong;
}


//坐标转换平面坐标
SpeedLine.prototype.getPixel = function(point){
	var pointObj = new BMap.Point(point[0],point[1]);
	var pixel =this.map.pointToPixel(pointObj);    
	return {
		x: pixel.x,
		y: pixel.y
	};
}

/*
 * var nums = ["one", "two", "four"];
 * nums.insert(2, 'three'); // 注意数组索引, [0,1,2..]
 * array // ["one", "two", "three", "four"]
 */
Array.prototype.insert = function (index, item) {
	this.splice(index, 0, item);
};