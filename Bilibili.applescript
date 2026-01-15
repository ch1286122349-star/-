on run
    set targetUrl to "https://www.bilibili.com/"
    tell application "Google Chrome"
        activate
        if (count of windows) is 0 then
            make new window
        end if
        open location targetUrl
    end tell
end run
