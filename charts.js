var canvas = document.getElementById('canvaz')
var ctx = canvas.getContext('2d')

var dataArray, database = 0, opsB = [true,true,true,true]
var xMult, yMult, yDis, xDis, ops = [1,1,1,1], outer,inner
var m, sliders = [0,1], curSlider, yM
var upd = false,d,btn,xs,dd, opsDts, drawX
var clientX,clientY,inf,inV,dt
var colors = [
	["#eef3fa","silver","#778899","white","#d8dde4","black", "silver"],
	["#eef3fa","#171c24","#778899","#293340","#3c4a6e","white", "#3c4a6e"]],curCol=0

fetch("https://api.myjson.com/bins/19ds0q") //loadData
	.then(function(response) {
		return response.json();
	})
	.then(function(data) {
		dataArray = data
		for (var i = 1;i < data[database].columns.length;++i) data[database].columns[i][0] = null
		m = getMax(0,data[database].columns[1].length)
		yM  = m
		opsDts = Array.apply(null,Array(data[database].columns[0].length))
		upd = true
	})

yDis = window.innerHeight*0.55 + 75
yMult = window.innerHeight*0.45
outer = document.getElementsByClassName('rounded')
inner = document.getElementsByClassName('in')
btn = document.getElementById('switcher')
inf = document.getElementById('info')
inV = document.getElementsByClassName('val')
dt = document.getElementById('date')

canvas.addEventListener('touchstart',function(e){tstart(e.touches[0].clientX,e.touches[0].clientY)}, false)
canvas.addEventListener('touchmove',function(e){tmove(e.changedTouches[0].clientX,e.touches[0].clientX, e.touches[0].clientY)}, false)
canvas.addEventListener('touchend',function(){inf.style.visibility = 'hidden';drawX = -10},false)
btn.addEventListener('click', function(){changeColor()},false)

	function next() {
		++database; if (database > dataArray.length-1) database = 0
		for (var i = 1;i < dataArray[database].columns.length;++i) dataArray[database].columns[i][0] = null
		m = getMax(0,dataArray[database].columns[1].length)
		yM  = m
		opsDts = Array.apply(null,Array(dataArray[database].columns[0].length))
	}

	function changeColor(){
		curCol = Math.abs(curCol-1)
		if (curCol == 0) btn.innerHTML = "Switch to Night Mode"
		else btn.innerHTML = "Switch to Day Mode"
		document.getElementById('bd').style.backgroundColor = colors[curCol][3]
		inf.style.backgroundColor = colors[curCol][3]
		inf.style.borderColor = colors[curCol][6]
		dt.style.color = colors[curCol][5]
		for (var i = 0; i < inner.length;++i) {
			inner[i].style.color = colors[curCol][5]
			outer[i].style.borderColor = colors[curCol][4]
		}
	}

	function switcher(value) {opsB[value] = !opsB[value]}

	function tstart (x,y) {
	clientX = x
	clientY = y
	if (clientY > yDis+100 && clientY < yDis+200) {
		if (clientX > sliders[0]*window.innerWidth-24 && clientX < sliders[0]*window.innerWidth+48) curSlider = 0
		else if (clientX > sliders[1]*window.innerWidth-48 && clientX < sliders[1]*window.innerWidth+24) curSlider = 1
		else if (clientX > sliders[0]*window.innerWidth+48 && clientX < sliders[1]*window.innerWidth-48) {curSlider = 2, d=sliders[1]-sliders[0]}
		else curSlider = null
	}
	else curSlider = null
	}
	function tmove(ch,cx,y) {
		pos2X = clientX-ch
		if (curSlider == 0) sliders[0] = (ch/window.innerWidth-0.005).clamp(0,sliders[1]-0.15) 
		if (curSlider == 1) sliders[1] = (ch/window.innerWidth+0.005).clamp(sliders[0]+0.15, 1)
		if (curSlider == 2){
			sliders[0] = (sliders[0] - pos2X/window.innerWidth).clamp(0,1-d)
			sliders[1] = (sliders[0]+d).clamp(sliders[0]+0.15, 1)
			clientX = cx
		}

		if (clientY < yDis) {
			var p1 = -(dataArray[database].columns[0].length * (xDis+xMult))/(dd*canvas.width)
			var p2 = p1 + (dataArray[database].columns[0].length-p1)*(ch/window.innerWidth)
			var p3 = Math.round((p2+1.5).clamp(1,dataArray[database].columns[0].length-1))
			dt.innerHTML = UNIXtoDate(dataArray[database].columns[0][p3],1)
			inf.style.visibility = 'visible'
			inf.style.left = (ch+50).clamp(0,canvas.width-250)
			drawX = ch-35
			inf.style.top = y-200

			for (var i = 0; i < 4;++i) {
				if (inV[i].style.visibility == 'visible') {
					inV[i].style.color = Object.values(dataArray[database].colors)[i]
					inV[i].innerHTML = Object.values(dataArray[database].names)[i] + ": " +dataArray[database].columns[i+1][p3]
				}
			}
		}
	}
	//UPDATE FRAME
	window.requestAnimationFrame(function update() {
		canvas.width = window.innerWidth-75
		canvas.height = window.innerHeight
		ctx.clearRect(0,0,canvas.width, canvas.height)
	if (upd) {
		var len = dataArray[database].columns[0].length
		dd = Math.pow(sliders[1]-sliders[0], -1)
		xMult = (window.innerWidth/dataArray[database].columns[0].length)*dd*0.95
		yM = lerp(yM, getMax(Math.floor(sliders[0]*len), Math.ceil(sliders[1]*len)), 0.3)
		xDis = -sliders[0]*canvas.width*dd-xMult
		yAxis()
		//lines
		for (var i=1;i<dataArray[database].columns.length;++i) 
			if (dataArray[database].columns[i] != null) {
				draw(dataArray[database].columns[i], yM, Object.values(dataArray[database].colors)[i-1], yDis, yMult,xMult,xDis,ops[i-1])
				draw(dataArray[database].columns[i], m, Object.values(dataArray[database].colors)[i-1], yDis+200, 100, canvas.width/len,0,ops[i-1])
			}
		drawSlider(sliders[0]*canvas.width,0)
		drawSlider(sliders[1]*canvas.width-12,1)
		drawCircles()

		ctx.beginPath()
		ctx.moveTo(0,yDis)
		ctx.lineTo(canvas.width,yDis)
		ctx.strokeStyle = colors[curCol][4]
		ctx.lineWidth = 5
		ctx.stroke()

		ctx.beginPath()
		ctx.moveTo(drawX,0)
		ctx.lineTo(drawX,yDis)
		ctx.lineWidth = 2
		ctx.stroke()
		
		initOps(Math.ceil((dataArray[database].columns[0].length*0.124)/dd))
		drawText()
		//bools
		for (var i = 1;i<5;++i)
			if (dataArray[database].columns[i] != null) {
				var name=Object.values(dataArray[database].names)[i-1];
				outer[i-1].style.visibility = 'visible' 
				if (inf.style.visibility == 'visible') inV[i-1].style.visibility = 'visible'
				else inV[i-1].style.visibility = 'hidden'
				inner[i-1].innerHTML = name; 
				outer[i-1].style.width = (70+name.length*35)+"px"
			} else {outer[i-1].style.visibility = 'hidden'; inV[i-1].style.visibility = 'hidden'}
		}
		window.requestAnimationFrame(update)
	})

	function yAxis () {
		ctx.globalAlpha = 1
		ctx.fillStyle = colors[curCol][6]
		ctx.font = "26px Verdana"
		ctx.lineWidth = 2
		ctx.fillText(0,5,yDis-10)
		for (var i = 1; i < 6; ++i) {
			ctx.fillText(Math.round(yM/i),5,yDis-10-(6-i)*157)

			ctx.beginPath()
			ctx.moveTo(0,yDis-(6-i)*157)
			ctx.lineTo(canvas.width,yDis-(6-i)*157)
			ctx.strokeStyle = colors[curCol][4]
			ctx.stroke()
		}
	}

	function initOps (every) {
		for (var i = 0; i < dataArray[database].columns[0].length; ++i){
			if (opsDts[i] == null) opsDts[i] = 0
			if (i%every == 0) opsDts[i] = lerp(opsDts[i],1,0.2)
			else opsDts[i] = lerp(opsDts[i],0,0.3)
		}
	}

	function drawText (){
		ctx.fillStyle = colors[curCol][6]
		ctx.font = "26px Verdana"
		for (var i = 0; i < dataArray[database].columns[0].length-1; ++i){
			ctx.globalAlpha = opsDts[i]
			ctx.fillText(UNIXtoDate(dataArray[database].columns[0][i+1],0),(i/dataArray[database].columns[0].length)*dd*canvas.width+xDis+xMult, yDis+40)
		}
	}

	function drawCircles() {
		for (var i = 0; i < outer.length;++i) {
			if (opsB[i]) ops[i] = lerp(ops[i],1,0.3) 
			else ops[i] = lerp(ops[i],0,0.3)

			if (outer[i].style.visibility == 'visible') {
			ctx.fillStyle = Object.values(dataArray[database].colors)[i]
			ctx.strokeStyle = Object.values(dataArray[database].colors)[i]
			ctx.lineWidth = 5
			ctx.beginPath()
			var ds = outer[i].style.left
			ctx.arc(ds.substring(0,ds.length-2), yDis+258, 22, 0, 2*Math.PI)
			ctx.globalAlpha = 1
			ctx.stroke()
			ctx.globalAlpha = ops[i]
			ctx.fill()
			}
		}
	}

	function getMax(from, to) {
		var list = []
		for (var i = from;i<to;++i) {for (var l = 1; l < dataArray[database].columns.length;++l) if (dataArray[database].columns[l] != null && opsB[l-1]) list.push(dataArray[database].columns[l][i])}
		if (Math.max.apply(null, list) > 0) return Math.max.apply(null, list)
		else return m
	}
	function lerp(a,b,t){return((1-t)*a+t*b)}
	
	function draw(values,max,colors,yPos,yMax,xM, xD,opc) {
	ctx.globalAlpha = opc
	ctx.beginPath()
	ctx.moveTo(xMult,yPos - values/max *yMax)
	for (var i = 1; i < values.length;++i) {
	ctx.lineTo(i*xM + xD, yPos-values[i]/max*yMax)
	ctx.moveTo(i*xM + xD, yPos-values[i]/max*yMax)
	}
	ctx.strokeStyle = colors
	ctx.lineWidth = 3
	ctx.stroke()
	}

	function drawSlider(pos,num) {
	ctx.globalAlpha = 0.4
	ctx.fillStyle = colors[curCol][1]
	if (num==0) ctx.fillRect(0, yDis+100, pos, 100)
	if (num==1) ctx.fillRect(pos+12, yDis+100, canvas.width, 100)

	ctx.globalAlpha = 0.3
	ctx.fillStyle = colors[curCol][2]
	ctx.fillRect(pos, yDis+100, 12, 100)
	}

var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'June', 'July', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec']
var dayz = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
function UNIXtoDate (value,nn) {
	var date = new Date(value)
	var days = date.getDate(); month = date.getMonth(); day = date.getDay()

	if (nn == 0) return months[month] + " " + days
	else return  dayz[day] + ", " + months[month] + " " + days
}

Number.prototype.clamp = function(min, max) {
	return Math.min(Math.max(this, min), max);
  };