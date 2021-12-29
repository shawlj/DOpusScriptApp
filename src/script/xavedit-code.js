var $=this,xfunc=[],xcmd,xmap,xdlg,xpath,xfbox,xofn="";
function OnClick(clickData)
{
	 //保存到github项目中
	 // 这是帮助您入门的 OnClick 例子脚本。
	 // （您可以使用菜单 "默认" 用您自己的脚本替换此脚本。）
	 // 
	 // 一些概要（其余内容请参阅手册的 脚本参考部分）：
	 // - clickData.func.command:
	 //     命令对象。
	 //     预配置有源，目的地和选定的项目。
	 //     更改源/目的地：
	 //       cmd.SetSource, .SetSourceTab, .SetDest, .SetDestTab.
	 //     更改文件文件夹依照：
	 //       cmd.ClearFiles, .AddFile, .AddFilesFromFile, .RemoveFile 等
	 //     运行简单的单行命令：
	 //       cmd.RunCommand "Help ABOUT"
	 //     运行多行命令：
	 //       cmd.Clear
	 //       cmd.AddLine "Help ABOUT"
	 //       cmd.AddLine "Help LICENCEMANAGER"
	 //       cmd.Run
	 // - clickData.func.Dlg
	 //     显示信息框和其它 UI 的对话框对象。
	 //     与配置源标签作为其父窗口。
	 // - clickData.func.sourcetab and .desttab:
	 //     源和目的地文件夹标签。
	 //     访问数据，例如：
	 //       tab.selected, .selected_dirs, .selected_files.
	 //       tab.all, .dirs, .files.
	 //       tab.path（标签的文件夹路径）。
	 //       tab.lister（包含标签的顶层列表器）。
	 //       tab.right（告诉您标签是在左侧还是在右侧）。
	 //       等
	 // --------------------------------------------------------
	 DOpus.ClearOutput();
	 // --------------------------------------------------------
	 this.xcmd = clickData.func.command;
	 this.xcmd.deselect = false; // Prevent automatic deselection
	 // --------------------------------------------------------
	 this.xdlg=DOpus.Dlg;
	 //this.xfunc=clickData.func;
	 
	 //xdlg.SetAccpetDrops(true);
	 //xdlg.AccpetDrop=true;
	 //设置接收鼠标拖拽文件事件（不能实现）
	 //Accept Drops
	 //xdlg.drop= true;
	 //this.xdlg.window = DOpus.Listers(0);
	 //xdlg.top=true;
	 this.xdlg.detach=true;
	 //xdlg.window = clickData.func.sourcetab
	 //$.xcmd.RunCommand("Set VIEW=Details");
	 this.xdlg.title="视频音频处理程序(Shawlj)";
	 this.xdlg.template="xffmpeg";
	 this.xdlg.window = DOpus.Listers(0);
	 //$.xctrl("xffmpeg").SetSize(200,300);
	 //this.xdlg.Control("xffmpeg").SetSize(200,300);
	 this.xdlg.Show();
	 //this.xdlg.Create().RunDlg();
	 
	 //核心逻辑代码块(程序监听)
	 this.xinit(clickData.func.sourcetab);
	 while (true) {
		var Msg = this.xdlg.GetMsg();
	    if (!Msg.result) break;
		var event = Msg.event;
		//$.xlog(Msg+":---{"+Msg.result+"}:{"+event+"}:{"+Msg.focus+"}:{"+Msg.control+"}:{"+Msg.value+"}:{"+Msg.data+"}");

		//判断触发事件对象是否本身，防止死循环赋值
		if(Msg.focus){
			//$.xlog(event+":"+event.search("click"));
			//双击删除，右键设置选中项的名称作为输出名称
			if(event=="click" && Msg.control!="xcheck"){
				eval(Msg.control).call();
			}else if(event=="dblclk"){
				this.xremove();
			}else if(event=="rclick"){
				this.xrclick();
			}else if(event=="editchange" && Msg.control=="xname"){
				this.xgencmd();
			}else if(event=="editchange" && Msg.control=="xoutput"){
				this.xeditdir();
			}else if(event=="selchange" && Msg.control=="xformat"){
				this.xsuffix();
			}else if(event=="selchange" && Msg.control=="xfunc"){
				this.xgencmd();
			}
		}
		if(event=="drop" && Msg.control=="xfbox"){
			this.xdrop(Msg.object);
		}
	}
}

//***********************************************************************
//                          业务逻辑处理
//***********************************************************************
//初始化数据
function xinit(xtab){
	//-vcodec libx264
	//装载命令
	var xffmpeg={
		0:"ffmpeg -i $1 -i $2 -c copy7 "+$.xpath+"\\$36",
		1:"ffmpeg -i $1 -i $2 -c copy "+$.xpath+"\\$3",
		2:"ffmpeg -i $1 -i $2 -c copy "+$.xpath+"\\$3",
		3:"ffmpeg -i $1 -i $2 -c copy "+$.xpath+"\\$3"
	};
	this.xreset();
	this.xctrl("xfbox").RemoveItem(-1);
	this.xctrl({xname:"",xcmd:""});
	this.xmap=DOpus.Create.Map();
	if(xtab){
		this.xfbox=$.xctrl("xfbox");
		this.xaddfile(xtab.selected);
		this.xctrl("xoutput",this.xpath=DOpus.FSUtil.Resolve(xtab.path));
			for(var x=new Enumerator($.xctrl("xfunc"));!x.atEnd();x.moveNext()){
			$.xfunc.push(x.item().name);
		}
	}
}

//生成命令
//命令教程：    https://www.cnblogs.com/tinywan/p/6120995.html
function xgencmd(xctrl1){
	//读取关键表单的值组合命令
	var xfunc=$.xctrl("xfunc").value;
	var fname=$.xctrl("xname").value;
	var xdrate=$.xctrl("xdrate").value;
	var xdcode=$.xctrl("xdcode").value;
	var xformat=$.xctrl("xformat").value;

	//【多个视频合并为一个】：ffmpeg -i "concat:1000.ts|2000.ts|" -c copy output.mp4
	//https://blog.csdn.net/m_422744746/article/details/118487026
	//https://www.ruanyifeng.com/blog/2020/01/ffmpeg.html
	//https://www.jianshu.com/p/3c8c4a892f3c
	//$.xctrl("xcmd").value("ffmpeg -i {0} -i {1} -c copy "+$.xpath+"\\"+$.xctrl("xname").value);
	var xc,xs=Number($.xctrl("xfunc").value);
	switch(xs){
		case 1:xc=$.xmerge();break;
		case 2:xc=$.xtrack();break;
		case 3:xc=$.xgraba();break;
		case 4:xc=$.xgrabv();break;
		case 5:xc=$.xgrabs();break;
		case 6:xc=$.xconver();break;
		case 7:xc=$.xresolution();break;
		case 8:xc=$.xcompress();break;
		case 9:xc=$.xsubtitle();break;
		case 10:xc=$.xlogo();break;
		case 11:xc=$.xgauss();break;
		case 12:xc=$.xsection();break;
		case 13:xc=$.xcrop();break;
		case 14:xc=$.xrotate();break;
		case 15:xc=$.xstuff();break;
		default:$.xctrl("xcmd").value("");break;
	}
	if(xc){
		xc+=('"{0}\\{1}"').format($.xpath,$.xctrl("xname").value);
		$.xctrl("xcmd").value(xc);
	}
	$.xlog("{0} -> [{1}]".format($.xfunc[xs],xc));
}

//01 -> 合并文件
function xmerge(){
	return 'ffmpeg -i "concat:{x}" -c copy ';
}
//02 -> 添加音轨
function xtrack(){
	$.xlog("2222");
	return 'ffmpeg -i "{0}" -i "{1}" -c copy ';
}
//03 -> 提取音频流
function xgraba(){
	return 'ffmpeg -i "{0}" -vn -c:a copy ';
}
//04 -> 提取视频流
function xgrabv(){
	return 'ffmpeg -i "{0}" -vcodec copy -an ';
}
//05 -> 提取字幕流
function xgrabs(){
	return 'ffmpeg -i "{0}" -i "{1}" -c copy ';
}
//06 -> 容器格式转换
function xconver(){
	return 'ffmpeg -i "{0}" ';
}

//------------------- TODO 未完待续 -------------------
//中文教程:     https://www.jianshu.com/p/3c8c4a892f3c
//07 -> 调整分辨率
function xresolution(){
	return 'ffmpeg -i "{0}" -s 1920/{1}x1080/{2} ';
	//return 'ffmpeg -i "{0}" -vf scale=1080/{1}:-1 '; 效果同上
	//return 'ffmpeg -i "{0}" -vf scale=1920/{1}:1080/{2} ';
	//改变为原视频的90%大小：
	//ffmpeg -i input.mpg -vf scale=iw0.9:ih0.9 output.mp4
	//保证视频宽高等比缩放
	//ffmpeg -i input.avi -vf scale=400:-1
	//ffmpeg -i input.avi -vf scale=-1:400(高)
}
//08 -> 压缩视频-降码率
function xcompress(){
	return 'ffmpeg -i "{0}" -minrate {1}/K -maxrate {2}/K -bufsize 2000K ';
}
//09 -> 添加字幕
function xsubtitle(){
	//翻转（水平：-vf hflip，垂直：-vf vflip）
	//ffplay -f lavfi -i 输入.mp4 -vf hflip
	//旋转（transpose={0,1,2,3}）0-3分别表示逆时针90°,顺时针90°...
	return 'ffmpeg -i {0}/.mp4 -vf subtitles={1}/.srt ';
}
//10 -> 添加水印
function xlogo(){
	//以logo左右角为例
	return 'ffmpeg -i {0}/input.mp4 -i {1}/logo.png -filter_complex overlay=W-w output.mp4 ';
}
//11 -> 高斯模糊
function xgauss(){
	return 'ffplay -i {0}/input.mp4 -vf unsharp=13:13:-2 ';
}
//12 -> 截取视频
function xsection(){
	return 'ffmpeg -i "{0}" -vf scale=1080/{1}:-1 ';
}
//13 -> 裁剪视频
function xcrop(){
	//裁剪视频区域（利用该功能可以实现去除黑边）
	//比如：裁剪视频中间三分之一
	//ffmpeg -i input -vf crop=iw/3:ih :iw/3:0 output
	//裁剪黑边(分两步：先获取黑边区域，再将黑边区域参数带入命令执行)
	//ffplay jidu.mp4 -vf cropdetect
	//ffplay jidu.mp4 –vf crop=672:272:0:54
	//例：裁剪中间一半区域
	return 'ffmpeg -i input.avi -vf crop=iw/2:ih/2 output.avi';
}
//14 -> 旋转/翻转
function xrotate(){
	//翻转（水平：-vf hflip，垂直：-vf vflip）
	//ffplay -f lavfi -i 输入.mp4 -vf hflip
	//旋转（transpose={0,1,2,3}）0-3分别表示逆时针90°,顺时针90°...
	return 'ffplay -f lavfi -i {0}/testsrc -vf vflip ';
}
//15 -> 填充视频
function xstuff(){
	//例如：取30像素粉色边框包围视频
	return 'ffplay -i input.mp4 -vf pad=iw+60:ih+60:30:30:pink';
}
//修改输出目录事件
function xeditdir(){
	$.xgencmd($.xpath=$.xctrl("xoutput").value);
}

//更改输出目录路径
function xmodify(){
	var xfolder=$.xdlg.Folder;
	if(xfolder.longpath){
		$.xctrl("xoutput").value($.xpath=xfolder.longpath);
		$.xgencmd();
	}
}

//右键菜单
function xrclick(){
	var pdlg=DOpus.Dlg;
	pdlg.window=DOpus.Listers(0);
	pdlg.choices=DOpus.Create.Vector("排序(S)","添加(A)", "删除(D)", "清空(C)", "-","生成(G)","命令(X)","参数(P)","重置(R)","初始化(I)");
	pdlg.menu=DOpus.Create.Vector; 
	switch(pdlg.Show){
		case 1:$.xsorder();break;
		case 2:$.xappend();break;
		case 3:$.xremove();break;
		case 4:$.xclear();break;
		case 6:$.xgname();break;
		case 7:$.xstart();break;
		case 8:$.xparse();break;
		case 9:$.xreset();break;
		case 10:$.xinit();break;
		default:break;
	}
}

//将数组类型转为Vector对象并排序（降序）
function xvector(args,sort){
	//var xvector=DOpus.Create.Vector("1","A","0").sort();//仅支持基本类型排序
	var vector=DOpus.Create.Vector();
	for(var i=0;i<args.length;i++){
		vector.push_back(args[i]);
	}
	sort==true&&vector.sort();
	//$.xlog(DOpus.TypeOf(vector));
	for(var x=new Enumerator(vector);!x.atEnd();x.moveNext()){
		$.xlog("sort after: {{0}}".format(x.item()));
	}
	return vector;
}

//对列表进行重排序（降序）
function xsorder(){
	var keys=$.xkeys($.xmap,true);
	$.xfbox.RemoveItem(-1);
	var tmap=DOpus.Create.Map();
	tmap.assign($.xmap);
	$.xmap.clear();
	for(var i=0;i<keys.length;i++){
		$.xfbox.AddItem(keys[i]);
		$.xmap(keys[i])=tmap(keys[i]);
	}
}

//解析查看视频详情参数
function xparse(){
	for(var x,s=new Enumerator($.xfbox.value);!s.atEnd();s.moveNext()){
		$.xshell('cd /d %userprofile%\\Desktop && ffmpeg -i "{0}" -hide_banner'.format($.xmap(s.item().name)));
		break;
	}
}
//重置设置参数
function xreset(){
	for(var i in x=["xfunc","xdrate","xdcode","xformat","xcodec","xvga","xpre"]) $.xctrl(x[i],"0");
}

//添加文件
function xdrop(v){
	$.xaddfile(v);
}
//添加文件
function xappend(){
	$.xaddfile($.xdlg.Multi);
	return true;
}
function xaddfile(files){
	for (var x=new Enumerator(files);!x.atEnd();x.moveNext()){
		//DOpus.FSUtil;
		if (!x.item().is_dir){
			if(!$.xmap.exists(x.item().name)){
				$.xfbox.AddItem(x.item().name);
				$.xmap(x.item().name)=x.item();
			}
		}
	}
}

//双击移除列表(获取选中项移除)
function xremove(){
	for(var s=new Enumerator($.xfbox.value);!s.atEnd();s.moveNext()){
		for(var x=new Enumerator($.xfbox);!x.atEnd();x.moveNext()){
			if(s.item().name==x.item().name){
				$.xfbox.RemoveItem(x.item());
				$.xmap.erase(s.item().name);
			}
		}
	}
}

//自动设置输出文件名称(未选中时依次查找,选中时获取选中的文件名作为输出名)
function xauto(){
	var xm=$.xgname();
}
function xgname(x){
	if($.xctrl("xfunc").value=="0"){
		$.xmsg("请选择功能","error");
	}else if($.xmap.empty){
		if($.xmsg("请添加文件后再尝试获取","error") >0){
			$.xappend();
		}
	}else{
		var e=$.xnull($.xfbox.value);
		if(e){
			for(e;!e.atEnd();e.moveNext()){$.xofn=e.item().name;break;}
		}else{
			$.xofn=$.xnext($.xmap,$.xofn);
		}
		$.xsuffix();
	}
}

//获取对象的下一个值
function xnext(obj,name){
	var first=false,next=false,tname=name,fname;
	if(DOpus.TypeOf(obj)=="object.Map"){
		for(var e=new Enumerator(obj);!e.atEnd();e.moveNext()){
			if(!first){first=true,fname=e.item();}
			if(e.item().equals(name)){next=true;continue;}
			if(!name||next){name=e.item();break;}
		}
	}else{
		for(var k in obj){
			if(!first){first=true,fname=eval(k);}
			if($.xequals(k,name)){next=true;continue;}
			if(!name||next){name=eval(k);break;}
		}
	}
	return tname==name?fname:name;
}
//获取设置输出文件名及后缀格式
function xsuffix(){
 	var fname=DOpus.FSUtil.NewPath($.xofn).stem;//ext 后缀
	var format=$.xctrl("xformat").value;
	var suffix=((format!=0&&format!=4)?$.xctrl("xformat").label:null);
	$.xctrl("xname",$.xdate(0).append("-",suffix==null?$.xofn:fname,suffix));
	$.xgencmd();
}


//清空列表
function xclear(){
	if($.xnull($.xfbox)){
		if($.xmsg("确认清空列表","question")==1){
			$.xmap.clear();
			$.xfbox.RemoveItem(-1);
			$.xctrl({xformat:"0",xname:"",xcmd:""});
		}
	}
}

//打开命令行
function xstart(){
	var opath=$.xexists($.xctrl("xoutput").value);
	if(opath==false){
		opath="%userprofile%\\Desktop";
	}
	$.xshell(("cd /d {0}").format(opath));
}

//执行命令
function xexecute(){
	var opath=$.xexists($.xctrl("xoutput").value);
	if(opath){
		//1、检是否选择功能
		//2、检查输出名称是否完整
		//3、检查文件列表是否为空
		if($.xctrl("xfunc").value=="0"){
			$.xmsg("请选择功能","error");
		}else if($.xmap.size<1){
			if($.xmsg("请添加文件","error")==1) $.xappend();
		}else if($.xlen("xname")==null){
			$.xmsg("输出文件名不能为空","error");
			$.xctrl("xname").focus=true;
		}else{
			//4、调用ffmpeg命令
			var xffmpeg=("cd /d {0} & {1}").format(opath,$.xctrl("xcmd").value);
			var xfnames=new Array();
			for(var e=new Enumerator($.xmap);!e.atEnd();e.moveNext()){
				xfnames.push($.xmap(e.item()));
			}
			//$.xctrl("xclog").value("");
			//var rs=$.xcmd.RunCommand(xffmpeg.format(xfnames[0],xfnames[1]));
			//http://www.manks.top/ffmpeg-stream-selection-map.html
			//https://bbs.csdn.net/topics/380230212
			//https://www.itdaan.com/blog/2011/12/21/1ed4deee8e28029baadf390f436b1e65.html
			//思路：可以将执行命令结果输出到临时文件中
			//再读取临时文件，加载到控制台
			//再删除临时文件即可
			//参考：  https://resource.dopus.com/t/help-import-the-hash-sum-from-rhash-exe-to-a-text-file/37553/8
			$.xshell(xffmpeg.format(xfnames[0],xfnames[1]));
			//$.xlog(rs);
			//var Excel = new ActiveXObject("Excel.Application", "MyServer");
			$.xlog("参数："+xffmpeg.format(xfnames[0],xfnames[1]));
		}
	}
}

//执行命令行
function xshell(cmd,flag){
	new ActiveXObject("wscript.shell").Run('cmd /k "chcp 65001 && {0}"'.format(cmd),flag||1);
	$.xlog("执行命令: "+cmd);
}

//检查目录是否存在
function xexists(p){
	var x=false;
	if(p.length<1){
		$.xmsg("输出目录不能为空","error");
	}else if($.xvalid(p)<0){
		$.xmsg("输出目录格式不正确","error");
	}else if(!DOpus.FSUtil.Exists(p)){
		if($.xmsg("目录不存在，是否创建目录？","question")==1){
			$.xshell('md "{0}"'.format(p),x=true);
		}
	}else{
		return p;
	}
	return x?p:x;
}

//获取指定名称控件对象或赋值
function xctrl(xcn,val){
	if(xcn.constructor==String){
		if(val) $.xdlg.Control(xcn).value(val);
		return $.xdlg.Control(xcn);
	}else{
		for(var k in xcn){
			$.xdlg.Control(k).value(xcn[k]);
		}
	}
}

//数据操作
function xjson(xk,xv){
	if(xv){
		$.xdb[xk]=xv;
	}else{
		delete $.xdb[xk];
	}
	$.xlog("【"+xk+"】-【"+$.xdb["'"+xk+"'"]+"】");
}

//消息提示对话框
function xmsg(str,icon){
	var xd=DOpus.Dlg;
	xd.icon=icon||"info";
	xd.top=true;
	xd.message=str;
	xd.title="操作提示";
	return xd.Show;//int
}

//输出日志信息
function xlog(arg){
	DOpus.Output("[{0}]-INFO: {1}".format($.xdate(1),arg));
}

//判断集合是否为空
function xnull(val){
	var e=new Enumerator(val);
	return e.atEnd()?null:e;
}

//判断对象内容是否为空
function xempty(obj){
	for(var k in obj)
		return false;
	return true;
}

//检查字符串为空
function xlen(n){
	var s=$.xctrl(n).value;
	if(s==null||s.trim().length<1){
		return null;
	}
	return s;
}
//消除指定符号
function xreplace(str,sign){
	return str.replace(sign,"");
}
//比较特殊字符串
function xequals(s,t){
	if(t){
		return s.trim(true)==t.trim();
	}else{
		return eval(s)==eval(t);
	}
}

//检查输出目录路径合法性(返回-1)
function xvalid(path){
	return new String(path).search(/^[a-z]:\\[^<>,/,\,|,:,"",*,? ]+(\.[a-z0-9]+|$)/i);
}

//获取map对象所有key值数组
function xkeys(m,s){
	var arr=[];
	for(var x=new Enumerator(m);!x.atEnd();x.moveNext()){
		arr.push(x.item());
	}
	s==true&&arr.sort();
	return arr;
}

//生成日期时间信息[用于日志信息跟踪等]
function xdate(x){
	var d=new Date();
	var y=[d.getFullYear(),("0"+(d.getMonth()+1)).slice(-2),("0"+d.getDate()).slice(-2)];
	var m=[("0"+d.getHours()).slice(-2),("0"+d.getMinutes()).slice(-2),("0"+d.getSeconds()).slice(-2)];
	if(x){
		return y.join("-")+" "+m.join(":");
	}
	return "["+y.join('-')+"-"+m.join('')+"]";
}

//正则去掉字符串两端指定字符（默认空字符串）
String.prototype.trim=function(x){
	if(x){
		return this.substring(1,this.length-1);
		//去掉两端相同x字符
		//return this.replace(new RegExp("^\\"+x+"|\\"+x+"$","ig"), '');
	}
	return this.replace(/^\s+|\s+$/g, '');
}

//扩展字符串拼接
String.prototype.append=function(){
	for(var x=this,i=0;i<arguments.length;i++){
		if(arguments[i])
			x+=arguments[i];
	}
	return x;
}

//扩展字符串格式化功能
String.prototype.format=function(){
	if(this.search("{x}")>-1){
		var xs="";
		for(var s=new Enumerator($.xctrl("xfbox"));!s.atEnd();s.moveNext()){
			xs+=s.item().name.append("|");
		}
		return this.replace("{x}",xs);
		//xconcat.substring(0,xconcat.length-1);
	}else{
		for(var x=this,i=0;i<arguments.length;i++){
			x=x.replace(new RegExp("\\{"+i+"\\}","g"), arguments[i]);
		}
	}
	return x;
}

//扩展字符串比较功能
String.prototype.equals=function(x){
	return this==x;
}
