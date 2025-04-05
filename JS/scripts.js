document.addEventListener('DOMContentLoaded', () => {
    const buttons = document.querySelectorAll('.btn');

    buttons.forEach(button => {
        button.addEventListener('click', (event) => {
            event.preventDefault();

            // Lấy URL từ thuộc tính href của nút
            const url = button.getAttribute('href');

            // Chuyển hướng đến trang khác
            window.location.href = url;
        });
    });
});
