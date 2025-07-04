
function showLoading() {
    loadingTimeout = setTimeout(() => {
        console.log("open loading effect")
        document.getElementById("for-loading").style.display = "flex";
    }, 500);
}

function closeLoading() {
    clearTimeout(loadingTimeout);
    document.getElementById("for-loading").style.display = "none";
}


const contactForm = document.querySelector("#contact-container");
const orderName = document.querySelector("#order-name");
const orderEmail = document.querySelector("#order-email");
const orderPhone = document.querySelector("#order-phone");
const allSection = document.querySelectorAll("section");


orderName.value = "test"
orderEmail.value = "test@email"
orderPhone.value = "012345678"



function checkEmpty(inputElement) {
    inputElement.addEventListener("input", function () {
        if (inputElement.value.trim() === "") {
            alert("資料不得為空！")
        } else {
            inputElement.style.border = "";
        }
    });
}



if (allSection.length != 0) {
    checkEmpty(orderName);
    checkEmpty(orderEmail);
    checkEmpty(orderPhone);
    TPDirect.setupSDK(159848, 'app_3N8ITdt5Vp3cIPv5xV4IQTzn9OYjuOG2B6PVPMhj0wD5mheHm39rFpHSwKaH', 'sandbox')

    TPDirect.card.setup({
        fields: {
            number: {
                element: '#card-number',
                placeholder: '複製右側數字'
            },
            expirationDate: {
                element: '#card-expiration-date',
                placeholder: '複製右側數字'
            },
            ccv: {
                element: '#card-ccv',
                placeholder: '複製右側數字'
            }
        },
        styles: {
            'input': {
                'font-size': '16px',
            },
            ':focus': {
                'color': 'black'
            },
            '.valid': {
                'color': 'green'
            },
            '.invalid': {
                'color': 'red'
            }

        },
        // 此設定會顯示卡號輸入正確後，會顯示前六後四碼信用卡卡號
        isMaskCreditCardNumber: true,
        maskCreditCardNumberRange: {
            beginIndex: 6,
            endIndex: 11
        }
    })



    const orderButton = document.querySelector("#booking-check-button");
    orderButton.style.pointerEvents = 'none';
    orderButton.style.opacity = '0.5';


    const checkNumber = document.querySelector("#check-for-number");
    const checkExp = document.querySelector("#check-for-exp");
    const checkCcv = document.querySelector("#check-for-ccv");

    checkNumber.textContent = "4242 4242 4242 4242"
    checkExp.textContent = "44/44"
    checkCcv.textContent = "444"

    TPDirect.card.onUpdate(function (update) {
        // update.canGetPrime === true
        // --> you can call TPDirect.card.getPrime()
        if (update.canGetPrime) {
            orderButton.style.pointerEvents = 'auto';
            orderButton.style.opacity = '1';
        } else {
            orderButton.style.pointerEvents = 'none'
            orderButton.style.opacity = '0.5';
        }

        // cardTypes = ['mastercard', 'visa', 'jcb', 'amex', 'unionpay','unknown']
        if (update.cardType === 'visa') {
            // Handle card type visa.
        }

        // number 欄位是錯誤的
        if (update.status.number === 2) {
            orderButton.style.pointerEvents = 'none'
            orderButton.style.opacity = '0.5';
            // checkNumber.textContent = "格式輸入錯誤"
        } else if (update.status.number === 0) {
            checkNumber.textContent = "正確"
        }

        if (update.status.expiry === 2) {
            orderButton.style.pointerEvents = 'none'
            orderButton.style.opacity = '0.5';
            // checkExp.textContent = "格式輸入錯誤"
        } else if (update.status.expiry === 0) {
            checkExp.textContent = "正確"
        }

        if (update.status.ccv === 2) {
            orderButton.style.pointerEvents = 'none'
            orderButton.style.opacity = '0.5';
            // checkCcv.textContent = "格式輸入錯誤"
        } else if (update.status.ccv === 0) {
            checkCcv.textContent = "正確"
        }
    })


    orderButton.addEventListener("click", onSubmit);

    async function onSubmit(event) {
        event.preventDefault()
        let orderInformation = await getData();
        if (orderInformation == false) {
            return
        }
        const tappayStatus = TPDirect.card.getTappayFieldsStatus()

        // 確認是否可以 getPrime
        if (tappayStatus.canGetPrime === false) {
            alert('發生錯誤，請重新再試。')
            return
        }
        // Get prime
        TPDirect.card.getPrime((result) => {
            if (result.status !== 0) {
                console.log('get prime error ' + result.msg)
                return
            }
            let data = {
                "prime": result.card.prime,
                "order": orderInformation
            };
            showLoading()
            let token = localStorage.getItem("TOKEN");
            fetch("/api/users", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(data)
            })
                .then((res) => res.json())
                .then((result) => {

                    if (result.data) {
                        let orderNumber = result.data.number
                        window.location.href = `/thankyou?number=${orderNumber}`
                    }
                    if (result.error) {
                        alert("行程預定失敗")
                    }
                })
                .catch((err) => {
                    console.error(err);
                    alert("預定失敗，請重新預定")
                })
                .finally(() => {
                    closeLoading()
                })

        });
    }


    async function getData() {
        const token = localStorage.getItem("TOKEN");
        let tripData = await fetch("/api/booking", {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
        })
            .then((res) => res.json())
            .then((data) => {
                return data["data"];
            })
            .catch((error) => console.log(error))

        const orderName = document.querySelector("#order-name");
        const orderEmail = document.querySelector("#order-email");
        const orderPhone = document.querySelector("#order-phone");

        if (orderName.value == "" || orderEmail.value == "" || orderPhone.value == "") {
            alert("聯絡資訊不得為空！")
            return false

        }
        if (!orderEmail.validity.valid) {
            alert("請輸入正確的email格式")
            return false
        }
        return {
            "price": document.querySelector("#booking-total-price").textContent,
            "trip": await tripData,
            "contact": {
                "name": orderName.value,
                "email": orderEmail.value,
                "phone": orderPhone.value
            }
        }
    }


}

