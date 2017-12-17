require('normalize.css/normalize.css');
require('styles/App.scss');

import React from 'react';
import ReactDOM from 'react-dom';
//获取图片相关数据
let imageDatas = require('../data/imageDatas.json');
//将图片名信息转化成图片路径信息
imageDatas=function getImageURL(imageDatasArr) {
    for(let i=0;i<imageDatasArr.length;i++){
        let singleImageData=imageDatasArr[i];
        singleImageData.imageURL=require('../images/'+singleImageData.filename);
        imageDatasArr[i]=singleImageData;
    }
    return imageDatasArr;
}(imageDatas);

console.log(imageDatas);
//用来计算位置区间内的一个随机值
function getRangeRandom(low,high){
    return Math.floor(Math.random() * (high-low) + low);
}
//用来获取0-30度的一个正负值
function get30DegRandom() {
    return ((Math.random()>0.5 ? "" : "-") + Math.floor(Math.random() * 30));
}

//构建控制组件
class ControllerUnit extends React.Component{
    constructor(){
        super()
        this.handleClick=this.handleClick.bind(this);
    }
    handleClick(e){
        //点击的当前图片正在选中的状态就反转图片 否则将对应图片居中
        if(this.props.arrange.isCenter){
            this.props.inverse();
        }else{
            this.props.center();
        }
        e.stopPropagation();
        e.preventDefault();
    }
    render(){
        let controllerUnitClassName="controller-unit";
        //如果对应的是居中的图片，显示控制按钮的居中态
        if(this.props.arrange.isCenter){
            controllerUnitClassName += " is-center";
            //如果同时对应的是反转图片  显示控制按钮的反转态
            if(this.props.arrange.isInverse){
                controllerUnitClassName += " is-inverse";
            }
        }
        return(
            <span className={controllerUnitClassName} onClick={this.handleClick}></span>
        )
    }
}
//构建图片组件
//figure自包含的单个单元内容   单个照片
class ImgFigure extends React.Component {
    constructor(props) {
        super(props);
        this.handleClick = this.handleClick.bind(this);
    }
    /*
    *  imgFigure 的点击处理函数
    * */
    handleClick (e){
        if(this.props.arrange.isCenter){
            this.props.inverse();
        }else{
            this.props.center();
        }
        e.stopPropagation();
        e.preventDefault();

    }
    render () {
        let styleObj={};
        // console.log(this.props.arrange)
        //如果props属性中指定了这张图片的位置，则使用
        if(this.props.arrange.pos){
            styleObj=this.props.arrange.pos;
        }

        //如果图片的旋转角度有值并且不为0，添加旋转角度
        if(this.props.arrange.rotate){
            (['MozTransform','msTransform','WebkitTransform','transform']).forEach(function (val) {
                styleObj[val]="rotate("+this.props.arrange.rotate+"deg)";
            }.bind(this));

        }
        //调中心图片层级
        if(this.props.arrange.isCenter){
            styleObj.zIndex=11;
        }

        let imgFigureClassName="img-figure";
        imgFigureClassName += this.props.arrange.isInverse ? ' is-inverse' : "";

            return(
            <figure className={imgFigureClassName} style={styleObj} onClick={this.handleClick}>
                <img src={this.props.data.imageURL} alt={this.props.data.title} />
                <figcaption>
                    <h2 className="img-title">{this.props.data.title}</h2>

                </figcaption>
                <div className="img-back" onClick={this.handleClick}>
                    <p>
                        {this.props.data.desc}
                    </p>
                </div>
            </figure>
        )
    }
}
class AppComponent extends React.Component {

    constructor(props){
        super(props);
        //用来存储排布的可取值范围
        this.constant={
            //中间
            centerPos:{
                left:0,
                top:0
            },
            //水平方向的取值范围
            hPosRange:{
                leftSecX:[0,0],
                rightSecX:[0,0],
                y:[0,0]
            },
            //垂直方向上的取值范围
            vPosRange:{
                x:[0,0],
                topY:[0,0]
            }
        };
        //因为要存多个图片的状态 所以设置一个数组
        this.state={
            imgsArrangeArr:[
                /*{
                    pos:{
                        left:"0",
                        top:"0"
                    },
                    rotate:0,  表示图片的旋转角度
                    isInverse:false,   图片正反面  false是正面
                    isCenter:false     图片是否居中  默认不居中
                }*/
            ]
        }
    }
    /*
    * 通过闭包变量来缓存当前被执行inverse的图片  在数组中的index的值
    *@param index  输入当前被执行inverse操作的图片对应的图片信息数组的index值
    *@ return {Function}  这是一个闭包函数  其内return一个真正待被执行的函数
    * */
    inverse(index){
        return ()=>{
            let imgsArrangeArr=this.state.imgsArrangeArr;
            imgsArrangeArr[index].isInverse=!imgsArrangeArr[index].isInverse;
            this.setState({
                imgsArrangeArr:imgsArrangeArr
            })
        }
    }



    /*
    * 重新通过区域范围重新排布这些图片  任意位置
    * @param centerIndex 指定居中哪张图片
    * */
    rearrange(centerIndex){

        let imgsArrangeArr=this.state.imgsArrangeArr;//数组
        let constant=this.constant;//对象

        let centerPos=constant.centerPos;
        let hPosRange=constant.hPosRange;
        let vPosRange=constant.vPosRange;

        let hPosRangeLeftSecX=hPosRange.leftSecX;
        let hPosRangeRightSecX=hPosRange.rightSecX;
        let hPosRangeY=hPosRange.y;

        let vPosRangeTopY=vPosRange.topY;
        let vPosRangeX=vPosRange.x;

        //用来存储部署在上侧区域的图片的状态信息  取0-1个放在这里
        let imgsArrangeTopArr=[];
        let topImgNum=Math.floor(Math.random() * 2); //去一个或者不取
        //用来标记 放在上侧的图片是从数组中哪个地方拿出来的
        let topImgSpliceIndex=0;

        //用来存储部署在中间区域的图片的状态信息  从原数组中删除1个  并返回数组
        let imgsArrangeCenterArr=imgsArrangeArr.splice(centerIndex,1);

        //首先居中centerIndex的图片,居中的centerIndex图片不需要旋转
        imgsArrangeCenterArr[0]={
            pos:centerPos,
            rotate:0,
            isCenter:true
        };




        //取出要布局上侧图片的状态信息
        topImgSpliceIndex=Math.floor(Math.random() * (imgsArrangeArr.length-topImgNum));
        imgsArrangeTopArr=imgsArrangeArr.splice(topImgSpliceIndex,topImgNum);
        //布局位于上侧的图片
        imgsArrangeTopArr.forEach(function (val,index) {
            imgsArrangeTopArr[index]={
                pos:{
                    top:getRangeRandom(vPosRangeTopY[0],vPosRangeTopY[1]),
                    left:getRangeRandom(vPosRangeX[0],vPosRangeX[1])
                },
                rotate:get30DegRandom(),
                isCenter:false
            }

        });
        //布局左右两侧的图片
        for(let i=0,j=imgsArrangeArr.length,k=j/2;i<j;i++){
            //左区域或者右区域的取值范围
            let hPosRangeLORX=null;
            //前半部分布置在左边  后半部分布置在右边
            if(i<k){
                hPosRangeLORX=hPosRangeLeftSecX;
            }else{
                hPosRangeLORX=hPosRangeRightSecX;
            }
            imgsArrangeArr[i]={
                pos:{
                    top:getRangeRandom(hPosRangeY[0],hPosRangeY[1]),
                    left:getRangeRandom(hPosRangeLORX[0],hPosRangeLORX[1])
                },
                rotate:get30DegRandom(),
                isCenter:false
            }

        }

        //因为splice对原数组有影响  所以现在要合并原数组
        //上
        if(imgsArrangeTopArr && imgsArrangeTopArr[0]){
            imgsArrangeArr.splice(topImgSpliceIndex,0,imgsArrangeTopArr[0])
        }
        //中
        imgsArrangeArr.splice(centerIndex,0,imgsArrangeCenterArr[0]);

        //设置state  一旦改变 重新渲染
        this.setState({
            imgsArrangeArr:imgsArrangeArr
        })

    }

    /*
    * 利用rearrange函数 居中对应的index图片
    * @param index 需要被居中的图片对应的图片信息数组的index值
    * @return {Function}
    * */
    center(index){
        return ()=>{
            this.rearrange(index);
        }
    }



    //组件加载以后，为每张图片计算其位置的范围
    componentDidMount(){
        //首先拿到舞台的大小
        let stageDOM=this.refs.stage;
        let stageW=stageDOM.scrollWidth;
        let stageH=stageDOM.scrollHeight;

        let halfStageW=Math.floor(stageW / 2);
        let halfStageH=Math.floor(stageH / 2);
        //拿到一个imageFigure的大小  因为所有的imgFigure大小一样
        let imgFigureDOM=ReactDOM.findDOMNode(this.refs.imgFigure0);
        let imgW=imgFigureDOM.scrollWidth;
        let imgH=imgFigureDOM.scrollHeight;
        let harfImgW=Math.floor(imgW / 2);
        let harfImgH=Math.floor(imgH / 2);

        //计算中心图片的位置点
        this.constant.centerPos={
            left:halfStageW - harfImgW,
            top:halfStageH - harfImgH
        }
        //计算左侧、右侧区域位置的取值范围
        this.constant.hPosRange.leftSecX[0]=-harfImgW;
        this.constant.hPosRange.leftSecX[1]=halfStageW - harfImgW * 3;
        this.constant.hPosRange.rightSecX[0]=halfStageW + harfImgW;
        this.constant.hPosRange.rightSecX[1]=stageW - harfImgW;
        this.constant.hPosRange.y[0]=-harfImgH;
        this.constant.hPosRange.y[1]=stageH - harfImgH;

        //计算上侧区域的取值范围
        this.constant.vPosRange.x[0]=halfStageW - imgW;
        this.constant.vPosRange.x[1]=halfStageW;
        this.constant.vPosRange.topY[0]=-harfImgH;
        this.constant.vPosRange.topY[1]=halfStageH - harfImgH * 3;

        //调用函数  重新排布
        this.rearrange(0);




    }

    render() {
        let controllerUnits=[];
        let imgFigures=[];
        imageDatas.forEach(function (value,index) {
            if(!this.state.imgsArrangeArr[index]){
                this.state.imgsArrangeArr[index]={
                    pos:{
                        left:0,
                        top:0
                    },
                    rotate:0,
                    isInverse:false,
                    isCenter:false
                }
            }
            //图画组件
            imgFigures.push(<ImgFigure key={index} data={value} ref={'imgFigure'+index} arrange={this.state.imgsArrangeArr[index]} inverse={this.inverse(index)} center={this.center(index)}/>);
            //控制组件
            controllerUnits.push(<ControllerUnit key={index} arrange={this.state.imgsArrangeArr[index]} inverse={this.inverse(index)} center={this.center(index)}/>);
        }.bind(this));





        return (
            <section className="stage" ref="stage">
                <section className="img-sec">
                    {imgFigures}
                </section>
                <nav className="controller-nav">
                    {controllerUnits}
                </nav>
            </section>
        );
    }
}

AppComponent.defaultProps = {
};

export default AppComponent;
