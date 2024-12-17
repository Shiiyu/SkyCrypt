import tippy from "tippy.js";

tippy.setDefaultProps({ allowHTML: true });

function validateURL(url: string) {
  const urlSegments = url.trim().split("/");
  if (urlSegments.length < 1) {
    throw new Error("please enter a Minecraft username or UUID");
  } else if (urlSegments.length > 2) {
    throw new Error(`"${url}" has too many "/"`);
  } else {
    if (urlSegments.length === 2) {
      if (urlSegments[1].match(/^[A-Za-z]+/)) {
        urlSegments[1] = urlSegments[1].charAt(0).toUpperCase() + urlSegments[1].substring(1).toLowerCase();
      } else if (!urlSegments[1].match(/^([0-9a-fA-F]{32})$/)) {
        if (urlSegments[1] === "") {
          throw new Error(`please enter valid profile name or UUID after "/"`);
        }
        throw new Error(`"${urlSegments[1]}" is not a valid profile name or UUID`);
      }
    }
    if (
      urlSegments[0].match(
        /^([0-9a-fA-F]{8})-?([0-9a-fA-F]{4})-?([0-9a-fA-F]{4})-?([0-9a-fA-F]{4})-?([0-9a-fA-F]{12})$/,
      )
    ) {
      urlSegments[0] = urlSegments[0].replaceAll("-", "");
    } else if (urlSegments[0].match(/^[\w ]{1,16}$/)) {
      urlSegments[0] = urlSegments[0].replace(" ", "_");
    } else {
      throw new Error(`"${urlSegments[0]}" is not a valid username or UUID`);
    }
    return "/stats/" + urlSegments.join("/");
  }
}

/**
 * escapes and html to make something safe to put into an HTML string
 * @param input unsafe string
 * @returns safe string
 * @example
 * escapeHtml("<script>alert('hi');</script>")
 * // returns "&lt;script&gt;alert(&#39;hi&#39;);&lt;/script&gt;"
 */
function escapeHtml(input: string): string {
  return input
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

document.querySelectorAll<HTMLFormElement>(".lookup-player").forEach((form) => {
  form.addEventListener("submit", (submitEvent: Event) => {
    submitEvent.preventDefault();
    const formData = new FormData(form);
    try {
      window.location.href = validateURL(formData.get("ign") as string);
    } catch (error) {
      const errorTip = tippy(form.querySelector("input") as HTMLInputElement, {
        trigger: "manual",
        content: escapeHtml(
          error instanceof Error ? error.message : String(error ?? "please enter a valid Minecraft username or UUID"),
        ),
      });
      errorTip.show();
      setTimeout(() => {
        errorTip.hide();
        setTimeout(() => {
          errorTip.destroy();
        }, 500);
      }, 1500);
    }
  });
});

export function getCookie(cookieName: string): string | undefined {
  if (document.cookie.length > 0) {
    let cookieStart = document.cookie.indexOf(cookieName + "=");
    if (cookieStart != -1) {
      cookieStart = cookieStart + cookieName.length + 1;
      let cookieEnd = document.cookie.indexOf(";", cookieStart);
      if (cookieEnd == -1) {
        cookieEnd = document.cookie.length;
      }
      return decodeURIComponent(document.cookie.substring(cookieStart, cookieEnd));
    }
  }

  return undefined;
}

export function setCookie(name: string, value: string, days?: number): void {
  let expires = "";
  if (days) {
    const date = new Date();
    date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
    expires = "; expires=" + date.toUTCString();
  }
  document.cookie = name + "=" + (value || "") + expires + "; SameSite=Lax; path=/";
}

export function eraseCookie(name: string) {
  document.cookie = name + "=; SameSite=Lax; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;";
}

const expanders = document.querySelectorAll(".expander");
for (const expander of expanders) {
  expander.addEventListener("click", () => {
    switch (expander.id) {
      case "settings-button":
        import("./elements/settings");
        break;
    }

    for (const otherExpander of expanders) {
      if (otherExpander != expander) {
        otherExpander.setAttribute("aria-expanded", "false");
      }
    }

    expander.setAttribute("aria-expanded", (expander.getAttribute("aria-expanded") != "true").toString());
  });

  const focusOutHandler = () => {
    setTimeout(() => {
      if (
        document.activeElement != document.body &&
        document.activeElement != expander &&
        !expander.nextElementSibling?.contains(document.activeElement)
      ) {
        expander.setAttribute("aria-expanded", "false");
      }
    });
  };

  expander.addEventListener("focusout", focusOutHandler);
  expander.nextElementSibling?.addEventListener("focusout", focusOutHandler);
}

tippy("*[data-tippy-content]");

const prideFlag = document.querySelector(".pride-flag") as HTMLElement;
const prideFlags = ["rainbow", "trans", "lesbian", "bi", "pan", "nb", "ace", "genderfluid", "logo"];

if (!prideFlags.includes(prideFlag.classList[1])) {
  prideFlag.className = "pride-flag logo";
  localStorage.removeItem("currentFlag");
}

prideFlag.addEventListener("click", function () {
  const oldFlag = prideFlag.classList[1];
  const newFlag = prideFlags[(prideFlags.indexOf(oldFlag) + 1) % prideFlags.length];
  localStorage.setItem("currentFlag", newFlag);
  prideFlag.className = "pride-flag " + newFlag;
});
