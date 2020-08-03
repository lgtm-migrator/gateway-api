const _censorWord = (str) => {
    return str[0] + "*".repeat(str.length - 2) + str.slice(-1);
 }
 
 const _censorEmail = (email) => {
    let arr = email.split("@");
    return _censorWord(arr[0]) + "@" + _censorWord(arr[1]);
 }

 export default {
    censorEmail : _censorEmail
  };