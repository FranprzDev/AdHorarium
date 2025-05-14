"use client"

import React from "react"
import { cn } from "@/lib/utils"

export const Button = ({
  children,
  onClick,
  className = "",
  variant = "default",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "outline" | "ghost" | "link"
}) => {
  const baseClasses =
    "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background"

  const variantClasses = {
    default: "bg-primary text-primary-foreground hover:bg-primary/90",
    outline: "border border-input hover:bg-accent hover:text-accent-foreground",
    ghost: "hover:bg-accent hover:text-accent-foreground",
    link: "underline-offset-4 hover:underline text-primary",
  }

  return (
    <button className={cn(baseClasses, variantClasses[variant], className)} onClick={onClick} {...props}>
      {children}
    </button>
  )
}

export const Switch = ({
  checked,
  onChange,
  label,
  className = "",
}: {
  checked: boolean
  onChange: (checked: boolean) => void
  label?: string
  className?: string
}) => {
  return (
    <label className={cn("flex items-center cursor-pointer", className)}>
      <div className="relative">
        <input type="checkbox" className="sr-only" checked={checked} onChange={(e) => onChange(e.target.checked)} />
        <div
          className={cn(
            "block w-10 h-6 rounded-full",
            checked ? "bg-primary" : "bg-gray-300 dark:bg-gray-600",
            "transition-colors",
          )}
        ></div>
        <div
          className={cn(
            "absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform",
            checked ? "transform translate-x-4" : "",
          )}
        ></div>
      </div>
      {label && <span className="ml-3 text-sm text-white">{label}</span>}
    </label>
  )
}

export const Tabs = ({
  tabs,
  value,
  onChange,
  className = "",
}: {
  tabs: { label: string; value: string }[]
  value: string
  onChange: (value: string) => void
  className?: string
}) => {
  return (
    <div className={cn("inline-flex rounded-md bg-white/5 p-1", className)}>
      {tabs.map((tab) => (
        <button
          key={tab.value}
          onClick={() => onChange(tab.value)}
          className={cn(
            "px-3 py-1.5 text-sm font-medium rounded-sm transition-colors",
            value === tab.value ? "bg-violet-600 text-white shadow-sm" : "text-slate-300 hover:text-white",
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}

export const Badge = ({
  children,
  color = "default",
  className = "",
}: {
  children: React.ReactNode
  color?: "default" | "primary" | "secondary" | "destructive" | "outline"
  className?: string
}) => {
  const colorClasses = {
    default: "bg-primary/10 text-primary hover:bg-primary/20",
    primary: "bg-violet-600 text-white hover:bg-violet-700",
    secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
    destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
    outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
  }

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors",
        colorClasses[color],
        className,
      )}
    >
      {children}
    </span>
  )
}

export const Tooltip = ({
  children,
  content,
  placement = "top",
  className = "",
}: {
  children: React.ReactNode
  content: React.ReactNode
  placement?: "top" | "right" | "bottom" | "left"
  className?: string
}) => {
  const [show, setShow] = React.useState(false)

  return (
    <div className="relative inline-block">
      <div onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
        {children}
      </div>
      {show && (
        <div
          className={cn("absolute z-50 bg-popover text-popover-foreground rounded-md shadow-md p-2 text-sm", className)}
          style={{
            top: placement === "bottom" ? "100%" : placement === "top" ? "auto" : "50%",
            bottom: placement === "top" ? "100%" : "auto",
            left: placement === "right" ? "100%" : placement === "left" ? "auto" : "50%",
            right: placement === "left" ? "100%" : "auto",
            transform:
              placement === "top" || placement === "bottom"
                ? "translateX(-50%)"
                : placement === "left" || placement === "right"
                  ? "translateY(-50%)"
                  : "translate(-50%, -50%)",
            marginTop: placement === "bottom" ? "8px" : 0,
            marginBottom: placement === "top" ? "8px" : 0,
            marginLeft: placement === "right" ? "8px" : 0,
            marginRight: placement === "left" ? "8px" : 0,
          }}
        >
          {content}
        </div>
      )}
    </div>
  )
}
