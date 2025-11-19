import PropTypes from "prop-types";
import { motion, AnimatePresence } from "framer-motion";

const transitionSettings = {
  type: "spring",
  stiffness: 100,
  damping: 20,
};

const variants = {
  enter: {
    opacity: 0,
    x: 40,
  },
  center: {
    opacity: 1,
    x: 0,
  },
  exit: {
    opacity: 0,
    x: -40,
  },
};

const FormSection = ({ active, children, sectionId }) => (
  <AnimatePresence mode="wait">
    {active && (
      <motion.div
        key={sectionId}
        initial="enter"
        animate="center"
        exit="exit"
        variants={variants}
        transition={transitionSettings}
        className="grid gap-6"
      >
        {children}
      </motion.div>
    )}
  </AnimatePresence>
);

FormSection.propTypes = {
  active: PropTypes.bool.isRequired,
  children: PropTypes.node.isRequired,
  sectionId: PropTypes.string.isRequired,
};

export default FormSection;