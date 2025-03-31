// 1. 轮播图
let slideIndex = 0;
showSlides();

function showSlides() {
  let slides = document.getElementsByClassName("mySlides");
  let dots = document.getElementsByClassName("dot");

  // 隐藏所有图片
  for (let i = 0; i < slides.length; i++) {
    slides[i].style.display = "none";
  }

  // 更新索引
  slideIndex++;
  if (slideIndex > slides.length) {
    slideIndex = 1;
  }

  // 显示当前图片
  slides[slideIndex - 1].style.display = "block";

  // 更新指示点状态
  for (let i = 0; i < dots.length; i++) {
    dots[i].className = dots[i].className.replace(" active", "");
  }
  dots[slideIndex - 1].className += " active";

  // 设置下一次轮播
  setTimeout(showSlides, 2000); // 每2秒切换一次
}

// 点击指示点切换图片
function currentSlide(index) {
  slideIndex = index - 1;
  showSlides();
}

// 为指示点绑定点击事件
let dots = document.getElementsByClassName("dot");
for (let i = 0; i < dots.length; i++) {
  dots[i].addEventListener("click", () => currentSlide(i + 1));
}

// 2. tab 切换
function openCategory(evt, categoryName) {
  var i, tabcontent, tablinks;
  tabcontent = document.getElementsByClassName("tabcontent");
  for (i = 0; i < tabcontent.length; i++) {
    tabcontent[i].style.display = "none";
  }
  tablinks = document.getElementsByClassName("tablinks");
  for (i = 0; i < tablinks.length; i++) {
    tablinks[i].className = tablinks[i].className.replace(" active", "");
  }
  document.getElementById(categoryName).style.display = "block";
  evt.currentTarget.className += " active";
}
