// JavaScript xử lý chuyển hướng khi người dùng nhấn nút "Bắt Đầu Kiểm Tra"
document.getElementById("input-test-form").addEventListener("submit", function(event) {
    event.preventDefault(); // Ngăn không cho form gửi và tải lại trang

    // Hiển thị thông báo (nếu cần)
    alert("Bài kiểm tra đã được gửi. Bạn sẽ được chuyển đến trang kiểm tra.");

    // Chuyển hướng đến trang test-page.html
    window.location.href = "testdauvao.html";
});


